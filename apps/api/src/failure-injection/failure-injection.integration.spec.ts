import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as billingDocumentPdf from '../billing/domain/billing-document-pdf';
import { CONTACT_PURPOSES } from '../clients/domain/client-status';
import { DOMAIN_EVENT_TYPES } from '../events/domain/domain-event-type';
import { DatabaseService } from '../infrastructure/database/database.service';
import { MEASUREMENT_STATUSES } from '../measurements/domain/measurement';
import { nextSyntheticCnpj } from '../master-business/synthetic-test-data';
import {
  BACKGROUND_JOB_KINDS,
  BACKGROUND_JOB_STATUSES,
} from '../platform/background-jobs/domain/background-job-kind';
import { BackgroundJobsRepository } from '../platform/background-jobs/repositories/background-jobs.repository';
import { FAULT_HOOKS } from '../platform/fault-injection/fault-hook.ids';
import { OUTBOX_EVENT_STATUSES } from '../platform/outbox/domain/outbox-status';
import { PLANNED_RESOURCE_KINDS } from '../service-orders/domain/resource-planning';
import { SERVICE_ORDER_STATUSES } from '../service-orders/domain/service-order';
import type { UatActor } from '../uat/uat-vertical-runner';
import {
  seedApprovedMeasurement,
  seedApprovedServiceRequest,
  seedBillingReady,
  seedCompletedOrder,
  seedPreparedServiceOrder,
  seedReleasedOrderWithTruck,
  seedReviewerActor,
} from '../concurrency/concurrency-seeds';
import { InjectedFaultError } from './configurable-fault-injection.port';
import {
  createFailureInjectionTestContext,
  type FailureInjectionTestContext,
} from './failure-injection-harness';

async function expectRejectedWithFault(promise: Promise<unknown>, hook: string): Promise<void> {
  await expect(promise).rejects.toSatisfy((error: unknown) => {
    return error instanceof InjectedFaultError && error.hook === hook;
  });
}

describe('Failure injection & transaction atomicity (PostgreSQL integration)', () => {
  let context: FailureInjectionTestContext;
  let actor: UatActor;

  beforeAll(async () => {
    context = await createFailureInjectionTestContext();
  }, 120_000);

  afterAll(async () => {
    await context.close();
  });

  beforeEach(async () => {
    await context.resetDatabase();
    actor = await context.seedAdminActor();
  }, 120_000);

  describe('client rollback', () => {
    it('rolls back client and mandatory contacts when fault injects before contacts', async () => {
      context.faultPort.setActiveHook(FAULT_HOOKS.ClientAfterInsertBeforeContacts);
      await expectRejectedWithFault(
        context.services.clientAccess.create(actor, {
          legalName: 'Fault Client',
          taxId: nextSyntheticCnpj(),
          contacts: [{ name: 'Ops', purpose: CONTACT_PURPOSES.Operational, phone: '69999990000' }],
        }),
        FAULT_HOOKS.ClientAfterInsertBeforeContacts,
      );

      const clients = await context.pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM pty.clients`);
      const contacts = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM pty.client_contacts`,
      );
      expect(clients.rows[0]?.count).toBe('0');
      expect(contacts.rows[0]?.count).toBe('0');
    });
  });

  describe('service request conversion rollback', () => {
    it('leaves no orphan service order when conversion fails after OS insert', async () => {
      const { approved } = await seedApprovedServiceRequest(context.services, actor);
      context.faultPort.setActiveHook(FAULT_HOOKS.ServiceRequestConvertAfterOsInsert);

      await expectRejectedWithFault(
        context.services.serviceRequestsAccess.convert(actor, approved.serviceRequest.id, {
          rowVersion: approved.serviceRequest.rowVersion,
        }),
        FAULT_HOOKS.ServiceRequestConvertAfterOsInsert,
      );

      const orders = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM so.service_orders WHERE service_request_id = $1`,
        [approved.serviceRequest.id],
      );
      const request = await context.pool.query<{ status: string; converted_service_order_id: string | null }>(
        `SELECT status::text AS status, converted_service_order_id FROM sr.service_requests WHERE id = $1`,
        [approved.serviceRequest.id],
      );
      expect(orders.rows[0]?.count).toBe('0');
      expect(request.rows[0]?.status).toBe('APPROVED');
      expect(request.rows[0]?.converted_service_order_id).toBeNull();
    });
  });

  describe('service order release rollback', () => {
    const releaseHooks = [
      FAULT_HOOKS.ServiceOrderReleaseAfterMutationBeforeHistory,
      FAULT_HOOKS.ServiceOrderReleaseAfterHistoryBeforeAudit,
      FAULT_HOOKS.ServiceOrderReleaseBeforeOutbox,
    ] as const;

    for (const hook of releaseHooks) {
      it(`rolls back release when fault injects at ${hook}`, async () => {
        const { prepared } = await seedPreparedServiceOrder(context.services, actor);
        context.faultPort.setActiveHook(hook);

        await expectRejectedWithFault(
          context.services.serviceOrdersAccess.release(actor, prepared.id, { rowVersion: prepared.rowVersion }),
          hook,
        );

        const row = await context.pool.query<{ status: string; row_version: number }>(
          `SELECT status::text AS status, row_version FROM so.service_orders WHERE id = $1`,
          [prepared.id],
        );
        expect(row.rows[0]?.status).toBe(SERVICE_ORDER_STATUSES.Prepared);
        expect(row.rows[0]?.row_version).toBe(prepared.rowVersion);

        const history = await context.pool.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM so.service_order_history_events WHERE service_order_id = $1 AND event_type = 'RELEASED'`,
          [prepared.id],
        );
        const outbox = await context.pool.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM evt.outbox_events WHERE aggregate_id = $1 AND event_type = $2`,
          [prepared.id, DOMAIN_EVENT_TYPES.ServiceOrderReleased],
        );
        expect(history.rows[0]?.count).toBe('0');
        expect(outbox.rows[0]?.count).toBe('0');
      });
    }

    it('keeps committed release when post-commit audit hook fails (audit is non-transactional)', async () => {
      const { prepared } = await seedPreparedServiceOrder(context.services, actor);
      context.faultPort.setActiveHook(FAULT_HOOKS.ServiceOrderReleaseAfterCommitBeforeAudit);

      await expectRejectedWithFault(
        context.services.serviceOrdersAccess.release(actor, prepared.id, { rowVersion: prepared.rowVersion }),
        FAULT_HOOKS.ServiceOrderReleaseAfterCommitBeforeAudit,
      );

      const row = await context.pool.query<{ status: string }>(
        `SELECT status::text AS status FROM so.service_orders WHERE id = $1`,
        [prepared.id],
      );
      expect(row.rows[0]?.status).toBe(SERVICE_ORDER_STATUSES.Released);
    });
  });

  describe('allocation rollback', () => {
    it('rolls back allocation when fault injects before outbox', async () => {
      const { released, asset } = await seedReleasedOrderWithTruck(context.services, actor);
      const planned = await context.services.planningAccess.planResource(actor, released.id, {
        requirementKind: PLANNED_RESOURCE_KINDS.PhysicalResource,
        resourceTypeCode: 'WATER_TRUCK',
        plannedQuantity: '1',
      });

      context.faultPort.setActiveHook(FAULT_HOOKS.AllocationAfterInsertBeforeOutbox);
      await expectRejectedWithFault(
        context.services.planningAccess.allocateResource(actor, released.id, {
          plannedResourceId: planned.id,
          physicalAssetId: asset.id,
          operationalStart: '2026-06-01T08:00:00.000Z',
          operationalEnd: '2026-06-01T10:00:00.000Z',
        }),
        FAULT_HOOKS.AllocationAfterInsertBeforeOutbox,
      );

      const active = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM res.resource_allocations WHERE physical_asset_id = $1 AND status = 'ACTIVE'`,
        [asset.id],
      );
      expect(active.rows[0]?.count).toBe('0');
    });
  });

  describe('execution completion rollback', () => {
    it('rolls back completion across mutation, history and outbox fault points', async () => {
      const hooks = [
        FAULT_HOOKS.ExecutionCompleteAfterValidationBeforeMutation,
        FAULT_HOOKS.ExecutionCompleteAfterMutationBeforeHistory,
        FAULT_HOOKS.ExecutionCompleteAfterHistoryBeforeOutbox,
      ] as const;

      for (const hook of hooks) {
        await context.resetDatabase();
        actor = await context.seedAdminActor();
        const seeded = await seedReleasedOrderWithTruck(context.services, actor);
        const startedOrder = await context.services.executionAccess.start(actor, seeded.released.id, {
          rowVersion: seeded.released.rowVersion,
        });
        await context.services.executionAccess.recordObservation(actor, startedOrder.id, {
          rowVersion: startedOrder.rowVersion,
          text: 'Observação para conclusão.',
        });
        const midOrder = await context.services.serviceOrdersAccess.getById(actor, startedOrder.id);
        await context.services.executionAccess.recordQuantity(actor, midOrder.id, {
          rowVersion: midOrder.rowVersion,
          quantityValue: '1',
          unitCode: 'SERVICE',
        });
        const readyOrder = await context.services.serviceOrdersAccess.getById(actor, midOrder.id);

        context.faultPort.setActiveHook(hook);
        await expectRejectedWithFault(
          context.services.executionAccess.complete(actor, readyOrder.id, { rowVersion: readyOrder.rowVersion }),
          hook,
        );

        const row = await context.pool.query<{ status: string }>(
          `SELECT status::text AS status FROM so.service_orders WHERE id = $1`,
          [readyOrder.id],
        );
        expect(row.rows[0]?.status).toBe(SERVICE_ORDER_STATUSES.InExecution);
      }
    });
  });

  describe('measurement approval rollback', () => {
    it('does not leave measurement partially approved when fault injects during approval', async () => {
      const { completed } = await seedCompletedOrder(context.services, actor);
      const measurement = await context.services.measurementsAccess.create(actor, completed.id);
      const submitted = await context.services.measurementsAccess.submit(actor, completed.id, measurement.id, {
        rowVersion: measurement.rowVersion,
      });
      const reviewed = await context.services.measurementsAccess.startReview(actor, completed.id, measurement.id, {
        rowVersion: submitted.rowVersion,
      });
      const reviewer = await seedReviewerActor(context.services, actor.identityId);

      for (const hook of [
        FAULT_HOOKS.MeasurementApproveAfterMutationBeforeHistory,
        FAULT_HOOKS.MeasurementApproveBeforeOutbox,
      ] as const) {
        context.faultPort.setActiveHook(hook);
        await expectRejectedWithFault(
          context.services.measurementsAccess.approve(reviewer, completed.id, measurement.id, {
            rowVersion: reviewed.rowVersion,
          }),
          hook,
        );

        const row = await context.pool.query<{ status: string }>(
          `SELECT status::text AS status FROM msr.measurements WHERE id = $1`,
          [measurement.id],
        );
        expect(row.rows[0]?.status).toBe(MEASUREMENT_STATUSES.UnderReview);

        const history = await context.pool.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM msr.measurement_history_events WHERE measurement_id = $1 AND event_type = 'APPROVED'`,
          [measurement.id],
        );
        expect(history.rows[0]?.count).toBe('0');
        context.faultPort.clear();
      }
    });
  });

  describe('billing rollback', () => {
    it('rolls back billing header when fault injects before items', async () => {
      const { completed, approved } = await seedApprovedMeasurement(context.services, actor);
      context.faultPort.setActiveHook(FAULT_HOOKS.BillingPrepareAfterHeaderBeforeItems);

      await expectRejectedWithFault(
        context.services.billingAccess.prepare(actor, completed.id, {
          measurementId: approved.id,
          paymentTerms: '30 DDL',
        }),
        FAULT_HOOKS.BillingPrepareAfterHeaderBeforeItems,
      );

      const records = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM bil.billing_records WHERE measurement_id = $1`,
        [approved.id],
      );
      const items = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM bil.billing_items bi
         JOIN bil.billing_records br ON br.id = bi.billing_record_id
         WHERE br.measurement_id = $1`,
        [approved.id],
      );
      expect(records.rows[0]?.count).toBe('0');
      expect(items.rows[0]?.count).toBe('0');
    });

    it('rolls back billing when fault injects after items before history', async () => {
      const { completed, approved } = await seedApprovedMeasurement(context.services, actor);
      context.faultPort.setActiveHook(FAULT_HOOKS.BillingPrepareAfterItemsBeforeHistory);

      await expectRejectedWithFault(
        context.services.billingAccess.prepare(actor, completed.id, {
          measurementId: approved.id,
          paymentTerms: '30 DDL',
        }),
        FAULT_HOOKS.BillingPrepareAfterItemsBeforeHistory,
      );

      const records = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM bil.billing_records WHERE measurement_id = $1`,
        [approved.id],
      );
      expect(records.rows[0]?.count).toBe('0');
    });
  });

  describe('storage compensation', () => {
    it('compensates object storage when DB fails after PDF generation', async () => {
      const { completed, billing } = await seedBillingReady(context.services, actor);
      context.faultPort.setActiveHook(FAULT_HOOKS.BillingDocumentAfterPdfBeforeDb);

      await expect(
        context.services.billingDocumentAccess.issue(actor, completed.id, billing.id, {}),
      ).rejects.toBeTruthy();

      const docs = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM bil.billing_documents WHERE billing_record_id = $1`,
        [billing.id],
      );
      expect(docs.rows[0]?.count).toBe('0');
    });

    it('rejects issuance when object storage upload fails', async () => {
      const { completed, billing } = await seedBillingReady(context.services, actor);
      context.faultingStorage.setFailPut(true);

      await expect(
        context.services.billingDocumentAccess.issue(actor, completed.id, billing.id, {}),
      ).rejects.toBeTruthy();

      const docs = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM bil.billing_documents WHERE billing_record_id = $1`,
        [billing.id],
      );
      expect(docs.rows[0]?.count).toBe('0');
    });

    it('rejects issuance on object storage timeout', async () => {
      const { completed, billing } = await seedBillingReady(context.services, actor);
      context.faultingStorage.setTimeoutPut(true);

      await expect(
        context.services.billingDocumentAccess.issue(actor, completed.id, billing.id, {}),
      ).rejects.toBeTruthy();

      const docs = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM bil.billing_documents WHERE billing_record_id = $1`,
        [billing.id],
      );
      expect(docs.rows[0]?.count).toBe('0');
    });

    it('rejects issuance on artifact hash mismatch', async () => {
      const { completed, billing } = await seedBillingReady(context.services, actor);
      const spy = vi.spyOn(billingDocumentPdf, 'renderBillingDocumentPdf').mockResolvedValueOnce({
        buffer: Buffer.from('%PDF-mismatch'),
        sha256: 'f'.repeat(64),
      });

      await expect(
        context.services.billingDocumentAccess.issue(actor, completed.id, billing.id, {}),
      ).rejects.toBeTruthy();

      spy.mockRestore();

      const docs = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM bil.billing_documents WHERE billing_record_id = $1`,
        [billing.id],
      );
      expect(docs.rows[0]?.count).toBe('0');
    });
  });

  describe('postgresql failure simulation', () => {
    it('does not report success on connection refused', async () => {
      context.faultPort.setActiveHook(FAULT_HOOKS.DbConnectionRefused);
      await expect(
        context.services.clientAccess.create(actor, {
          legalName: 'DB Fail',
          taxId: nextSyntheticCnpj(),
          contacts: [{ name: 'Ops', purpose: CONTACT_PURPOSES.Operational, phone: '69999990000' }],
        }),
      ).rejects.toBeTruthy();
      const clients = await context.pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM pty.clients`);
      expect(clients.rows[0]?.count).toBe('0');
    });

    it('does not report success on pool unavailable', async () => {
      context.faultPort.setActiveHook(FAULT_HOOKS.DbPoolUnavailable);
      await expect(
        context.services.clientAccess.create(actor, {
          legalName: 'Pool Fail',
          taxId: nextSyntheticCnpj(),
          contacts: [{ name: 'Ops', purpose: CONTACT_PURPOSES.Operational, phone: '69999990000' }],
        }),
      ).rejects.toBeTruthy();
    });
  });

  describe('process crash recovery', () => {
    it('recovers expired worker leases without eternal PROCESSING jobs', async () => {
      const dbService = { getConnection: () => ({ pool: context.pool }) } as DatabaseService;
      const jobsRepository = new BackgroundJobsRepository(dbService);

      const key = `failure:crash:${crypto.randomUUID()}`;
      const enqueued = await jobsRepository.enqueueJob({
        jobKind: BACKGROUND_JOB_KINDS.Integration,
        idempotencyKey: key,
        payload: { behavior: 'success' },
        maxAttempts: 3,
      });

      const claimed = await jobsRepository.claimJobs('crashed-worker', 1, 1);
      expect(claimed).toHaveLength(1);

      await context.pool.query(
        `UPDATE plt.background_jobs SET lease_expires_at = NOW() - interval '1 second' WHERE id = $1::uuid`,
        [enqueued.jobId],
      );
      await jobsRepository.releaseExpiredLeases();

      const pending = await jobsRepository.findByIdempotencyKey(key);
      expect(pending?.status).toBe(BACKGROUND_JOB_STATUSES.Pending);

      const processing = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM plt.background_jobs WHERE status = 'RUNNING' AND lease_expires_at < NOW()`,
      );
      expect(Number(processing.rows[0]?.count)).toBe(0);
    });
  });

  describe('outbox atomicity', () => {
    it('persists zero outbox events when business transaction rolls back', async () => {
      const { prepared } = await seedPreparedServiceOrder(context.services, actor);
      context.faultPort.setActiveHook(FAULT_HOOKS.ServiceOrderReleaseBeforeOutbox);

      await expectRejectedWithFault(
        context.services.serviceOrdersAccess.release(actor, prepared.id, { rowVersion: prepared.rowVersion }),
        FAULT_HOOKS.ServiceOrderReleaseBeforeOutbox,
      );

      const outbox = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM evt.outbox_events WHERE aggregate_id = $1`,
        [prepared.id],
      );
      expect(outbox.rows[0]?.count).toBe('0');
    });

    it('persists outbox event when business transaction commits', async () => {
      const { prepared } = await seedPreparedServiceOrder(context.services, actor);
      await context.services.serviceOrdersAccess.release(actor, prepared.id, {
        rowVersion: prepared.rowVersion,
      });

      const outbox = await context.pool.query<{ count: string; status: string }>(
        `SELECT COUNT(*)::text AS count, MIN(status)::text AS status
         FROM evt.outbox_events
         WHERE aggregate_id = $1 AND event_type = $2`,
        [prepared.id, DOMAIN_EVENT_TYPES.ServiceOrderReleased],
      );
      expect(outbox.rows[0]?.count).toBe('1');
      expect(outbox.rows[0]?.status).toBe(OUTBOX_EVENT_STATUSES.Pending);
    });
  });
});
