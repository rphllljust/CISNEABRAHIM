import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CONTACT_PURPOSES } from '../clients/domain/client-status';
import { CLIENT_ERROR_CODES } from '../clients/errors/client-error-codes';
import { DOMAIN_EVENT_TYPES } from '../events/domain/domain-event-type';
import { MEASUREMENT_STATUSES } from '../measurements/domain/measurement';
import { MEASUREMENTS_ERROR_CODES } from '../measurements/errors/measurements-error-codes';
import type { MasterBusinessTestContext } from '../master-business/master-business-harness';
import { REQUESTS_ERROR_CODES } from '../requests/errors/requests-error-codes';
import type { ServiceRequestDetailResponse } from '../requests/serializers/service-requests-response.serializer';
import { SERVICE_REQUEST_ORIGINS } from '../requests/domain/service-request';
import { ASSET_ERROR_CODES } from '../resources/errors/asset-error-codes';
import { PLANNED_RESOURCE_KINDS } from '../service-orders/domain/resource-planning';
import { SERVICE_ORDER_STATUSES } from '../service-orders/domain/service-order';
import { SERVICE_ORDERS_ERROR_CODES } from '../service-orders/errors/service-orders-error-codes';
import { BILLING_ERROR_CODES } from '../billing/errors/billing-error-codes';
import type { BillingDocumentDetailResponse } from '../billing/serializers/billing-document-response.serializer';
import type { UatActor } from '../uat/uat-vertical-runner';
import { nextSyntheticCnpj } from '../master-business/synthetic-test-data';
import { createConcurrencyTestContext } from './concurrency-harness';
import { assertNoRawSqlLeak, countDeadlocks, repeatCritical } from './concurrency-helpers';
import {
  countFulfilled,
  countRejected,
  runWithStartLatch,
} from './concurrency-latch';
import {
  CONCURRENCY_UNIT,
  seedApprovedMeasurement,
  seedApprovedServiceRequest,
  seedBillingReady,
  seedClient,
  seedCompletedOrder,
  seedDraftServiceOrder,
  seedPreparedServiceOrder,
  seedPublishedService,
  seedReleasedOrderWithTruck,
  seedReviewerActor,
} from './concurrency-seeds';

const TORTURE_CNPJ_NORMALIZED = '11222333000181';
const TORTURE_CNPJ_FORMATTED = '11.222.333/0001-81';
const CONCURRENT_CLIENT_ATTEMPTS = 20;
const CONCURRENT_WORKERS = 10;
const STABILITY_ITERATIONS = 3;

function buildCnpjVariants(count: number): string[] {
  const variants = [TORTURE_CNPJ_NORMALIZED, TORTURE_CNPJ_FORMATTED, '11.222.333/0001-81', '11222333000181'];
  return Array.from({ length: count }, (_, index) => variants[index % variants.length]!);
}

function rejectionReasons(results: PromiseSettledResult<unknown>[]): unknown[] {
  return results
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    .map((result) => result.reason as unknown);
}

describe('Concurrency torture (PostgreSQL integration)', () => {
  let context: MasterBusinessTestContext;
  let actor: UatActor;

  beforeAll(async () => {
    context = await createConcurrencyTestContext();
  }, 120_000);

  afterAll(async () => {
    await context.pool.end();
  });

  beforeEach(async () => {
    await context.resetDatabase();
    actor = await context.seedAdminActor();
  }, 120_000);

  describe('client duplication race', () => {
    it(`allows exactly one winner among ${CONCURRENT_CLIENT_ATTEMPTS} simultaneous CNPJ creates`, async () => {
      const taxIds = buildCnpjVariants(CONCURRENT_CLIENT_ATTEMPTS);
      const results = await runWithStartLatch(
        CONCURRENT_CLIENT_ATTEMPTS,
        taxIds.map(
          (taxId, index) => () =>
            context.services.clientAccess.create(actor, {
              legalName: `Concorrente ${index}`,
              taxId,
              contacts: [
                {
                  name: `Ops ${index}`,
                  purpose: CONTACT_PURPOSES.Operational,
                  email: `ops-${index}@concurrency.invalid`,
                },
              ],
            }),
        ),
      );

      expect(countFulfilled(results)).toBe(1);
      expect(countRejected(results)).toBe(CONCURRENT_CLIENT_ATTEMPTS - 1);
      for (const reason of rejectionReasons(results)) {
        expect(reason).toMatchObject({ code: CLIENT_ERROR_CODES.TAX_ID_CONFLICT });
        assertNoRawSqlLeak(reason);
      }

      const clientCount = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM pty.clients WHERE normalized_tax_id = $1`,
        [TORTURE_CNPJ_NORMALIZED],
      );
      expect(Number(clientCount.rows[0]?.count)).toBe(1);

      const orphanContacts = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM pty.client_contacts cc
         LEFT JOIN pty.clients c ON c.id = cc.client_id
         WHERE c.id IS NULL`,
      );
      expect(Number(orphanContacts.rows[0]?.count)).toBe(0);
    });
  });

  describe('service request conversion race', () => {
    it('creates a single service order under concurrent conversion', async () => {
      const { approved } = await seedApprovedServiceRequest(context.services, actor);
      const rowVersion = approved.serviceRequest.rowVersion;
      const requestId = approved.serviceRequest.id;

      const results = await runWithStartLatch(
        CONCURRENT_WORKERS,
        Array.from({ length: CONCURRENT_WORKERS }, () => () =>
          context.services.serviceRequestsAccess.convert(actor, requestId, { rowVersion }),
        ),
      );

      expect(countFulfilled(results)).toBe(1);
      expect(countRejected(results)).toBe(CONCURRENT_WORKERS - 1);

      const orderCount = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM so.service_orders WHERE service_request_id = $1`,
        [requestId],
      );
      expect(Number(orderCount.rows[0]?.count)).toBe(1);

      const requestRow = await context.pool.query<{
        status: string;
        converted_service_order_id: string | null;
      }>(
        `SELECT status::text AS status, converted_service_order_id
         FROM sr.service_requests WHERE id = $1`,
        [requestId],
      );
      expect(requestRow.rows[0]?.status).toBe('CONVERTED');
      expect(requestRow.rows[0]?.converted_service_order_id).toBeTruthy();
    });
  });

  describe('service order release race', () => {
    it('applies a single release transition under concurrent release attempts', async () => {
      const { prepared } = await seedPreparedServiceOrder(context.services, actor);
      const rowVersion = prepared.rowVersion;

      const results = await runWithStartLatch(
        CONCURRENT_WORKERS,
        Array.from({ length: CONCURRENT_WORKERS }, () => () =>
          context.services.serviceOrdersAccess.release(actor, prepared.id, { rowVersion }),
        ),
      );

      expect(countFulfilled(results)).toBe(1);
      expect(countRejected(results)).toBe(CONCURRENT_WORKERS - 1);

      const statusRow = await context.pool.query<{ status: string; row_version: number }>(
        `SELECT status::text AS status, row_version FROM so.service_orders WHERE id = $1`,
        [prepared.id],
      );
      expect(statusRow.rows[0]?.status).toBe(SERVICE_ORDER_STATUSES.Released);
      expect(statusRow.rows[0]?.row_version).toBe(rowVersion + 1);

      const history = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM so.service_order_history_events
         WHERE service_order_id = $1 AND event_type = 'RELEASED'`,
        [prepared.id],
      );
      expect(history.rows[0]?.count).toBe('1');

      const audit = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM audit.security_audit_events
         WHERE resource_id = $1 AND action = 'security:service-orders:service-order:release'`,
        [prepared.id],
      );
      expect(Number(audit.rows[0]?.count)).toBeGreaterThanOrEqual(1);

      const outbox = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM evt.outbox_events
         WHERE aggregate_id = $1 AND event_type = $2`,
        [prepared.id, DOMAIN_EVENT_TYPES.ServiceOrderReleased],
      );
      expect(outbox.rows[0]?.count).toBe('1');
    });
  });

  describe('release versus cancel race', () => {
    it('resolves release vs cancel at the dispute point with a valid terminal state', async () => {
      await repeatCritical(STABILITY_ITERATIONS, 'release-vs-cancel', async () => {
        await context.resetDatabase();
        const currentActor = await context.seedAdminActor();
        const { prepared } = await seedPreparedServiceOrder(context.services, currentActor);
        const rowVersion = prepared.rowVersion;

        const results = await runWithStartLatch(2, [
          () => context.services.serviceOrdersAccess.release(currentActor, prepared.id, { rowVersion }),
          () =>
            context.services.serviceOrdersAccess.cancel(currentActor, prepared.id, {
              rowVersion,
              cancellationReason: 'Concorrência release/cancel',
            }),
        ]);

        expect(countFulfilled(results)).toBe(1);
        expect(countRejected(results)).toBe(1);
        expect(countDeadlocks(results)).toBe(0);

        const row = await context.pool.query<{ status: string; row_version: number }>(
          `SELECT status::text AS status, row_version FROM so.service_orders WHERE id = $1`,
          [prepared.id],
        );
        expect([SERVICE_ORDER_STATUSES.Released, SERVICE_ORDER_STATUSES.Cancelled]).toContain(
          row.rows[0]?.status,
        );
        expect(row.rows[0]?.row_version).toBe(rowVersion + 1);

        const transitionEvents = await context.pool.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count
           FROM so.service_order_history_events
           WHERE service_order_id = $1 AND event_type IN ('RELEASED', 'CANCELLED')`,
          [prepared.id],
        );
        expect(transitionEvents.rows[0]?.count).toBe('1');
      });
    });
  });

  describe('optimistic concurrency (version conflict)', () => {
    it('rejects concurrent stale updates for Client', async () => {
      const created = await seedClient(context.services, actor);
      const results = await runWithStartLatch(2, [
        () =>
          context.services.clientAccess.update(actor, created.id, {
            version: created.version,
            tradeName: 'T1',
          }),
        () =>
          context.services.clientAccess.update(actor, created.id, {
            version: created.version,
            tradeName: 'T2',
          }),
      ]);
      expect(countFulfilled(results)).toBe(1);
      expect(countRejected(results)).toBe(1);
      expect(rejectionReasons(results)[0]).toMatchObject({ code: CLIENT_ERROR_CODES.VERSION_CONFLICT });
    });

    it('rejects concurrent stale updates for ServiceRequest', async () => {
      const client = await seedClient(context.services, actor);
      const published = await seedPublishedService(context.services, actor);
      const request = await context.services.serviceRequestsAccess.create(actor, {
        unitId: CONCURRENCY_UNIT,
        originSource: SERVICE_REQUEST_ORIGINS.DirectRequest,
        clientId: client.id,
        serviceDefinitionId: published.serviceDefinitionId,
        serviceDefinitionVersionId: published.id,
        description: 'Version conflict',
      });
      const rowVersion = request.serviceRequest.rowVersion;
      const results = await runWithStartLatch(2, [
        () =>
          context.services.serviceRequestsAccess.updateDraft(actor, request.serviceRequest.id, {
            rowVersion,
            description: 'T1',
          }),
        () =>
          context.services.serviceRequestsAccess.updateDraft(actor, request.serviceRequest.id, {
            rowVersion,
            description: 'T2',
          }),
      ]);
      expect(countFulfilled(results)).toBe(1);
      expect(countRejected(results)).toBe(1);
      expect(rejectionReasons(results)[0]).toMatchObject({ code: REQUESTS_ERROR_CODES.VERSION_CONFLICT });
    });

    it('rejects concurrent stale updates for ServiceOrder', async () => {
      const { created } = await seedDraftServiceOrder(context.services, actor);
      const results = await runWithStartLatch(2, [
        () =>
          context.services.serviceOrdersAccess.update(actor, created.id, {
            rowVersion: created.rowVersion,
            description: 'T1',
          }),
        () =>
          context.services.serviceOrdersAccess.update(actor, created.id, {
            rowVersion: created.rowVersion,
            description: 'T2',
          }),
      ]);
      expect(countFulfilled(results)).toBe(1);
      expect(countRejected(results)).toBe(1);
      expect(rejectionReasons(results)[0]).toMatchObject({
        code: SERVICE_ORDERS_ERROR_CODES.VERSION_CONFLICT,
      });
    });

    it('rejects concurrent stale updates for Asset', async () => {
      const { asset } = await seedReleasedOrderWithTruck(context.services, actor);
      const results = await runWithStartLatch(2, [
        () =>
          context.services.assetsAccess.update(actor, asset.id, {
            version: asset.version,
            name: 'T1',
          }),
        () =>
          context.services.assetsAccess.update(actor, asset.id, {
            version: asset.version,
            name: 'T2',
          }),
      ]);
      expect(countFulfilled(results)).toBe(1);
      expect(countRejected(results)).toBe(1);
      expect(rejectionReasons(results)[0]).toMatchObject({ code: ASSET_ERROR_CODES.VERSION_CONFLICT });
    });

    it('rejects concurrent stale updates for Measurement', async () => {
      const { completed } = await seedCompletedOrder(context.services, actor);
      const measurement = await context.services.measurementsAccess.create(actor, completed.id);
      const results = await runWithStartLatch(2, [
        () =>
          context.services.measurementsAccess.regenerate(actor, completed.id, measurement.id, {
            rowVersion: measurement.rowVersion,
          }),
        () =>
          context.services.measurementsAccess.regenerate(actor, completed.id, measurement.id, {
            rowVersion: measurement.rowVersion,
          }),
      ]);
      expect(countFulfilled(results)).toBe(1);
      expect(countRejected(results)).toBe(1);
    });

    it('rejects concurrent stale void for Billing', async () => {
      const { completed, billing } = await seedBillingReady(context.services, actor);
      const results = await runWithStartLatch(2, [
        () =>
          context.services.billingAccess.voidRecord(actor, completed.id, billing.id, {
            rowVersion: billing.rowVersion,
            voidReason: 'Void concorrente T1',
          }),
        () =>
          context.services.billingAccess.voidRecord(actor, completed.id, billing.id, {
            rowVersion: billing.rowVersion,
            voidReason: 'Void concorrente T2',
          }),
      ]);
      expect(countFulfilled(results)).toBe(1);
      expect(countRejected(results)).toBe(1);
      const rejection = rejectionReasons(results)[0] as { code?: string };
      expect([BILLING_ERROR_CODES.VERSION_CONFLICT, BILLING_ERROR_CODES.INVALID_STATE]).toContain(
        rejection.code,
      );

      const voidEvents = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM bil.billing_history_events
         WHERE billing_record_id = $1 AND event_type = 'VOIDED'`,
        [billing.id],
      );
      expect(voidEvents.rows[0]?.count).toBe('1');
    });
  });

  describe('asset allocation race', () => {
    it('prevents overbooking under many concurrent overlapping allocations', async () => {
      const { released, asset } = await seedReleasedOrderWithTruck(context.services, actor);
      const plannedIds: string[] = [];
      for (let index = 0; index < CONCURRENT_WORKERS; index += 1) {
        const planned = await context.services.planningAccess.planResource(actor, released.id, {
          requirementKind: PLANNED_RESOURCE_KINDS.PhysicalResource,
          resourceTypeCode: 'WATER_TRUCK',
          plannedQuantity: '1',
        });
        plannedIds.push(planned.id);
      }

      const payload = {
        physicalAssetId: asset.id,
        operationalStart: '2026-06-01T08:00:00.000Z',
        operationalEnd: '2026-06-01T10:00:00.000Z',
      };

      const results = await runWithStartLatch(
        CONCURRENT_WORKERS,
        plannedIds.map(
          (plannedResourceId) => () =>
            context.services.planningAccess.allocateResource(actor, released.id, {
              plannedResourceId,
              ...payload,
            }),
        ),
      );

      expect(countFulfilled(results)).toBe(1);
      expect(countRejected(results)).toBe(CONCURRENT_WORKERS - 1);

      const active = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM res.resource_allocations
         WHERE physical_asset_id = $1 AND status = 'ACTIVE'`,
        [asset.id],
      );
      expect(active.rows[0]?.count).toBe('1');
    });

    it('allows adjacent half-open intervals 08-10 and 10-12', async () => {
      const { released, asset } = await seedReleasedOrderWithTruck(context.services, actor);
      const plannedA = await context.services.planningAccess.planResource(actor, released.id, {
        requirementKind: PLANNED_RESOURCE_KINDS.PhysicalResource,
        resourceTypeCode: 'WATER_TRUCK',
        plannedQuantity: '1',
      });
      const plannedB = await context.services.planningAccess.planResource(actor, released.id, {
        requirementKind: PLANNED_RESOURCE_KINDS.PhysicalResource,
        resourceTypeCode: 'WATER_TRUCK',
        plannedQuantity: '1',
      });

      await context.services.planningAccess.allocateResource(actor, released.id, {
        plannedResourceId: plannedA.id,
        physicalAssetId: asset.id,
        operationalStart: '2026-06-01T08:00:00.000Z',
        operationalEnd: '2026-06-01T10:00:00.000Z',
      });
      const second = await context.services.planningAccess.allocateResource(actor, released.id, {
        plannedResourceId: plannedB.id,
        physicalAssetId: asset.id,
        operationalStart: '2026-06-01T10:00:00.000Z',
        operationalEnd: '2026-06-01T12:00:00.000Z',
      });
      expect(second.physicalAssetId).toBe(asset.id);
    });

    it('rejects overlapping intervals 08-10 and 09:59-11:00', async () => {
      const { released, asset } = await seedReleasedOrderWithTruck(context.services, actor);
      const plannedA = await context.services.planningAccess.planResource(actor, released.id, {
        requirementKind: PLANNED_RESOURCE_KINDS.PhysicalResource,
        resourceTypeCode: 'WATER_TRUCK',
        plannedQuantity: '1',
      });
      const plannedB = await context.services.planningAccess.planResource(actor, released.id, {
        requirementKind: PLANNED_RESOURCE_KINDS.PhysicalResource,
        resourceTypeCode: 'WATER_TRUCK',
        plannedQuantity: '1',
      });

      await context.services.planningAccess.allocateResource(actor, released.id, {
        plannedResourceId: plannedA.id,
        physicalAssetId: asset.id,
        operationalStart: '2026-06-01T08:00:00.000Z',
        operationalEnd: '2026-06-01T10:00:00.000Z',
      });

      await expect(
        context.services.planningAccess.allocateResource(actor, released.id, {
          plannedResourceId: plannedB.id,
          physicalAssetId: asset.id,
          operationalStart: '2026-06-01T09:59:00.000Z',
          operationalEnd: '2026-06-01T11:00:00.000Z',
        }),
      ).rejects.toBeDefined();
    });
  });

  describe('allocation versus deactivation race', () => {
    it('never allocates a concurrently deactivated asset', async () => {
      const { released, asset } = await seedReleasedOrderWithTruck(context.services, actor);
      const planned = await context.services.planningAccess.planResource(actor, released.id, {
        requirementKind: PLANNED_RESOURCE_KINDS.PhysicalResource,
        resourceTypeCode: 'WATER_TRUCK',
        plannedQuantity: '1',
      });

      const results = await runWithStartLatch<unknown>(2, [
        () =>
          context.services.planningAccess.allocateResource(actor, released.id, {
            plannedResourceId: planned.id,
            physicalAssetId: asset.id,
            operationalStart: '2026-06-01T08:00:00.000Z',
            operationalEnd: '2026-06-01T10:00:00.000Z',
          }),
        () => context.services.assetsAccess.deactivate(actor, asset.id, asset.version),
      ]);

      expect(countFulfilled(results)).toBeGreaterThanOrEqual(1);
      expect(countDeadlocks(results)).toBe(0);

      const assetRow = await context.pool.query<{ lifecycle_status: string }>(
        `SELECT lifecycle_status::text AS lifecycle_status FROM ast.physical_assets WHERE id = $1`,
        [asset.id],
      );
      const activeAllocations = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM res.resource_allocations
         WHERE physical_asset_id = $1 AND status = 'ACTIVE'`,
        [asset.id],
      );

      if (assetRow.rows[0]?.lifecycle_status === 'INACTIVE') {
        expect(activeAllocations.rows[0]?.count).toBe('0');
      } else {
        expect(activeAllocations.rows[0]?.count).toBe('1');
        const refreshed = await context.services.assetsAccess.getById(actor, asset.id);
        expect(refreshed.lifecycleStatus).toBe('ACTIVE');
      }
    });
  });

  describe('execution race', () => {
    it('resolves record execution versus complete without losing committed data', async () => {
      const { released } = await seedReleasedOrderWithTruck(context.services, actor);
      const started = await context.services.executionAccess.start(actor, released.id, {
        rowVersion: released.rowVersion,
      });
      await context.services.executionAccess.recordObservation(actor, started.id, {
        rowVersion: started.rowVersion,
        text: 'Observação antes da corrida.',
      });
      const mid = await context.services.serviceOrdersAccess.getById(actor, started.id);

      const results = await runWithStartLatch<unknown>(2, [
        () =>
          context.services.executionAccess.recordQuantity(actor, mid.id, {
            rowVersion: mid.rowVersion,
            quantityValue: '1',
            unitCode: 'SERVICE',
          }),
        () =>
          context.services.executionAccess.complete(actor, mid.id, {
            rowVersion: mid.rowVersion,
          }),
      ]);

      expect(countFulfilled(results)).toBeGreaterThanOrEqual(1);
      expect(countDeadlocks(results)).toBe(0);

      const current = await context.services.serviceOrdersAccess.getById(actor, mid.id);
      expect([SERVICE_ORDER_STATUSES.InExecution, SERVICE_ORDER_STATUSES.Completed]).toContain(
        current.status,
      );

      const entries = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM so.execution_entries WHERE service_order_id = $1`,
        [mid.id],
      );
      expect(Number(entries.rows[0]?.count)).toBeGreaterThanOrEqual(1);
    });
  });

  describe('measurement races', () => {
    async function seedReviewedMeasurement() {
      const { completed } = await seedCompletedOrder(context.services, actor);
      const measurement = await context.services.measurementsAccess.create(actor, completed.id);
      const submitted = await context.services.measurementsAccess.submit(actor, completed.id, measurement.id, {
        rowVersion: measurement.rowVersion,
      });
      const reviewed = await context.services.measurementsAccess.startReview(actor, completed.id, measurement.id, {
        rowVersion: submitted.rowVersion,
      });
      return { completed, measurement, reviewed };
    }

    it('allows only one approve under concurrent approve', async () => {
      const { completed, measurement, reviewed } = await seedReviewedMeasurement();
      const reviewer = await seedReviewerActor(context.services, actor.identityId);
      const results = await runWithStartLatch(2, [
        () =>
          context.services.measurementsAccess.approve(reviewer, completed.id, measurement.id, {
            rowVersion: reviewed.rowVersion,
          }),
        () =>
          context.services.measurementsAccess.approve(reviewer, completed.id, measurement.id, {
            rowVersion: reviewed.rowVersion,
          }),
      ]);
      expect(countFulfilled(results)).toBe(1);
      expect(countRejected(results)).toBe(1);
      const current = await context.services.measurementsAccess.getById(actor, completed.id, measurement.id);
      expect(current.status).toBe(MEASUREMENT_STATUSES.Approved);
    });

    it('resolves approve versus reject with a single terminal decision', async () => {
      const { completed, measurement, reviewed } = await seedReviewedMeasurement();
      const reviewer = await seedReviewerActor(context.services, actor.identityId);
      const results = await runWithStartLatch(2, [
        () =>
          context.services.measurementsAccess.approve(reviewer, completed.id, measurement.id, {
            rowVersion: reviewed.rowVersion,
          }),
        () =>
          context.services.measurementsAccess.reject(reviewer, completed.id, measurement.id, {
            rowVersion: reviewed.rowVersion,
            rejectionReason: 'Concorrência',
          }),
      ]);
      expect(countFulfilled(results)).toBe(1);
      expect(countRejected(results)).toBe(1);
      const current = await context.services.measurementsAccess.getById(actor, completed.id, measurement.id);
      expect([MEASUREMENT_STATUSES.Approved, MEASUREMENT_STATUSES.Rejected]).toContain(current.status);
    });

    it('resolves update versus approve without duplicate economic effect', async () => {
      const { completed } = await seedCompletedOrder(context.services, actor);
      const measurement = await context.services.measurementsAccess.create(actor, completed.id);
      const submitted = await context.services.measurementsAccess.submit(actor, completed.id, measurement.id, {
        rowVersion: measurement.rowVersion,
      });
      const reviewed = await context.services.measurementsAccess.startReview(actor, completed.id, measurement.id, {
        rowVersion: submitted.rowVersion,
      });
      const detail = await context.services.measurementsAccess.getById(actor, completed.id, measurement.id);
      const item = detail.items[0];
      expect(item).toBeTruthy();

      const reviewer = await seedReviewerActor(context.services, actor.identityId);
      const results = await runWithStartLatch(2, [
        () =>
          context.services.measurementsAccess.updateItem(actor, completed.id, measurement.id, item!.id, {
            rowVersion: reviewed.rowVersion,
            measuredQuantity: '1.0000',
          }),
        () =>
          context.services.measurementsAccess.approve(reviewer, completed.id, measurement.id, {
            rowVersion: reviewed.rowVersion,
          }),
      ]);
      expect(countFulfilled(results)).toBe(1);
      expect(countRejected(results)).toBe(1);

      const billingCount = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM bil.billing_records WHERE measurement_id = $1`,
        [measurement.id],
      );
      expect(Number(billingCount.rows[0]?.count)).toBeLessThanOrEqual(1);
    });

    it('resolves submit versus update on draft measurement', async () => {
      const { completed } = await seedCompletedOrder(context.services, actor);
      const measurement = await context.services.measurementsAccess.create(actor, completed.id);
      const detail = await context.services.measurementsAccess.getById(actor, completed.id, measurement.id);
      const item = detail.items[0];
      expect(item).toBeTruthy();

      const results = await runWithStartLatch(2, [
        () =>
          context.services.measurementsAccess.submit(actor, completed.id, measurement.id, {
            rowVersion: measurement.rowVersion,
          }),
        () =>
          context.services.measurementsAccess.updateItem(actor, completed.id, measurement.id, item!.id, {
            rowVersion: measurement.rowVersion,
            measuredQuantity: '1.0000',
          }),
      ]);

      expect(countFulfilled(results)).toBeGreaterThanOrEqual(1);
      const current = await context.services.measurementsAccess.getById(actor, completed.id, measurement.id);
      expect(
        current.status === MEASUREMENT_STATUSES.Submitted ||
          current.status === MEASUREMENT_STATUSES.Draft ||
          current.status === MEASUREMENT_STATUSES.UnderReview,
      ).toBe(true);
      for (const reason of rejectionReasons(results)) {
        if (reason && typeof reason === 'object' && 'code' in reason) {
          expect([
            MEASUREMENTS_ERROR_CODES.VERSION_CONFLICT,
            MEASUREMENTS_ERROR_CODES.NOT_EDITABLE,
            MEASUREMENTS_ERROR_CODES.INVALID_STATE,
            MEASUREMENTS_ERROR_CODES.DENIED,
          ]).toContain((reason as { code: string }).code);
        }
      }
    });
  });

  describe('billing race', () => {
    it('creates a single billing record under concurrent prepare', async () => {
      const { completed, approved } = await seedApprovedMeasurement(context.services, actor);
      const results = await runWithStartLatch(2, [
        () =>
          context.services.billingAccess.prepare(actor, completed.id, {
            measurementId: approved.id,
            paymentTerms: '30 DDL',
          }),
        () =>
          context.services.billingAccess.prepare(actor, completed.id, {
            measurementId: approved.id,
            paymentTerms: '30 DDL',
          }),
      ]);
      expect(countFulfilled(results)).toBe(1);
      expect(countRejected(results)).toBe(1);

      const billingCount = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM bil.billing_records
         WHERE measurement_id = $1 AND status <> 'VOIDED'`,
        [approved.id],
      );
      expect(Number(billingCount.rows[0]?.count)).toBe(1);
    });
  });

  describe('billing document numbering', () => {
    it('uses transactional sequence allocation (not MAX+1) and issues unique numbers concurrently', async () => {
      const repositorySource = readFileSync(
        resolve(__dirname, '../billing/repositories/billing-document.repository.ts'),
        'utf8',
      );
      expect(repositorySource).toContain('billing_document_number_sequences');
      expect(repositorySource).not.toMatch(/MAX\s*\(\s*document_number\s*\)\s*\+\s*1/i);

      const prepared: Array<{ completedId: string; billingId: string }> = [];
      for (let index = 0; index < 8; index += 1) {
        const { completed, billing } = await seedBillingReady(context.services, actor);
        prepared.push({ completedId: completed.id, billingId: billing.id });
      }

      const results = await runWithStartLatch(
        8,
        prepared.map(
          ({ completedId, billingId }) => () =>
            context.services.billingDocumentAccess.issue(actor, completedId, billingId, {}),
        ),
      );
      expect(countFulfilled(results)).toBe(8);

      const numbers = results
        .filter(
          (result): result is PromiseFulfilledResult<BillingDocumentDetailResponse> =>
            result.status === 'fulfilled',
        )
        .map((result) => result.value.documentNumber);
      expect(new Set(numbers).size).toBe(8);

      const collisions = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM (
           SELECT document_number
           FROM bil.billing_documents
           GROUP BY document_number
           HAVING COUNT(*) > 1
         ) duplicates`,
      );
      expect(Number(collisions.rows[0]?.count)).toBe(0);
    });
  });

  describe('idempotency race', () => {
    it('processes a single logical create for concurrent identical idempotency keys', async () => {
      const client = await seedClient(context.services, actor);
      const published = await seedPublishedService(context.services, actor);
      const idempotencyKey = `idem-race-${crypto.randomUUID()}`;
      const payload = {
        unitId: CONCURRENCY_UNIT,
        originSource: SERVICE_REQUEST_ORIGINS.DirectRequest,
        clientId: client.id,
        serviceDefinitionId: published.serviceDefinitionId,
        serviceDefinitionVersionId: published.id,
        description: 'Idempotency race',
        idempotencyKey,
      };

      const results = await runWithStartLatch(2, [
        () => context.services.serviceRequestsAccess.create(actor, payload),
        () => context.services.serviceRequestsAccess.create(actor, payload),
      ]);

      const fulfilled = results.filter(
        (result): result is PromiseFulfilledResult<ServiceRequestDetailResponse> =>
          result.status === 'fulfilled',
      );
      expect(fulfilled.length).toBeGreaterThanOrEqual(1);
      const ids = new Set(fulfilled.map((result) => result.value.serviceRequest.id));
      expect(ids.size).toBe(1);

      for (const reason of rejectionReasons(results)) {
        if (reason && typeof reason === 'object' && 'code' in reason) {
          expect((reason as { code: string }).code).toBe(REQUESTS_ERROR_CODES.DUPLICATE_IDEMPOTENCY);
        }
      }
    });

    it('returns conflict for concurrent divergent payload with same idempotency key', async () => {
      const client = await seedClient(context.services, actor);
      const published = await seedPublishedService(context.services, actor);
      const idempotencyKey = `idem-conflict-${crypto.randomUUID()}`;

      const results = await runWithStartLatch(2, [
        () =>
          context.services.serviceRequestsAccess.create(actor, {
            unitId: CONCURRENCY_UNIT,
            originSource: SERVICE_REQUEST_ORIGINS.DirectRequest,
            clientId: client.id,
            serviceDefinitionId: published.serviceDefinitionId,
            serviceDefinitionVersionId: published.id,
            description: 'Payload A',
            idempotencyKey,
          }),
        () =>
          context.services.serviceRequestsAccess.create(actor, {
            unitId: CONCURRENCY_UNIT,
            originSource: SERVICE_REQUEST_ORIGINS.DirectRequest,
            clientId: client.id,
            serviceDefinitionId: published.serviceDefinitionId,
            serviceDefinitionVersionId: published.id,
            description: 'Payload B',
            idempotencyKey,
          }),
      ]);

      expect(countFulfilled(results)).toBe(1);
      expect(countRejected(results)).toBe(1);
      expect(rejectionReasons(results)[0]).toMatchObject({
        code: REQUESTS_ERROR_CODES.DUPLICATE_IDEMPOTENCY,
      });
    });
  });

  describe('deadlock analysis', () => {
    it('does not surface recurring deadlocks under mixed concurrent contention', async () => {
      const operations: Array<() => Promise<unknown>> = [];
      for (let index = 0; index < 6; index += 1) {
        operations.push(() =>
          context.services.clientAccess.create(actor, {
            legalName: `Deadlock mix ${index}`,
            taxId: nextSyntheticCnpj(),
            contacts: [{ name: 'Ops', purpose: CONTACT_PURPOSES.Operational, phone: '69999990000' }],
          }),
        );
      }
      for (let index = 0; index < 4; index += 1) {
        operations.push(async () => {
          const { approved } = await seedApprovedServiceRequest(context.services, actor);
          return context.services.serviceRequestsAccess.convert(actor, approved.serviceRequest.id, {
            rowVersion: approved.serviceRequest.rowVersion,
          });
        });
      }

      const results = await Promise.allSettled(operations.map((operation) => operation()));
      expect(countDeadlocks(results)).toBe(0);
    });
  });
});
