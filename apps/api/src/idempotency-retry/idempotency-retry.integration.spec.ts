import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { InjectedFaultError } from '../failure-injection/configurable-fault-injection.port';
import {
  CONCURRENCY_UNIT,
  seedApprovedMeasurement,
  seedApprovedServiceRequest,
  seedBillingReady,
  seedClient,
  seedPreparedServiceOrder,
  seedPublishedService,
  seedReleasedOrderWithTruck,
  seedReviewerActor,
} from '../concurrency/concurrency-seeds';
import { countFulfilled, countRejected, runWithStartLatch } from '../concurrency/concurrency-latch';
import { DOMAIN_EVENT_TYPES } from '../events/domain/domain-event-type';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { TEST_INBOX_EVENT_TYPE } from '../integrations/inbox/handlers/test-integration-inbox.handler';
import { IntegrationsInboxModule } from '../integrations/inbox/integrations-inbox.module';
import { IntegrationInboxRepository } from '../integrations/inbox/repositories/integration-inbox.repository';
import { IntegrationInboxProcessorService } from '../integrations/inbox/services/integration-inbox-processor.service';
import { IntegrationInboxReceiveService } from '../integrations/inbox/services/integration-inbox-receive.service';
import { MEASUREMENT_STATUSES } from '../measurements/domain/measurement';
import { SERVICE_REQUEST_ORIGINS, SERVICE_REQUEST_STATUSES } from '../requests/domain/service-request';
import { REQUESTS_ERROR_CODES } from '../requests/errors/requests-error-codes';
import { FAULT_HOOKS } from '../platform/fault-injection/fault-hook.ids';
import { OUTBOX_EVENT_STATUSES } from '../platform/outbox/domain/outbox-status';
import { SERVICE_ORDER_STATUSES } from '../service-orders/domain/service-order';
import { SERVICE_ORDERS_ERROR_CODES } from '../service-orders/errors/service-orders-error-codes';
import type { UatActor } from '../uat/uat-vertical-runner';
import {
  createIdempotencyRetryTestContext,
  type IdempotencyRetryTestContext,
} from './idempotency-retry-harness';

function rejectionReasons(results: PromiseSettledResult<unknown>[]): unknown[] {
  return results
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    .map((result) => result.reason as unknown);
}

async function seedReadyToComplete(context: IdempotencyRetryTestContext, actor: UatActor) {
  const { released } = await seedReleasedOrderWithTruck(context.services, actor);
  const started = await context.services.executionAccess.start(actor, released.id, {
    rowVersion: released.rowVersion,
  });
  await context.services.executionAccess.recordObservation(actor, started.id, {
    rowVersion: started.rowVersion,
    text: 'Idempotency execution observation.',
  });
  const afterObservation = await context.services.serviceOrdersAccess.getById(actor, started.id);
  await context.services.executionAccess.recordQuantity(actor, afterObservation.id, {
    rowVersion: afterObservation.rowVersion,
    quantityValue: '1',
    unitCode: 'SERVICE',
  });
  return context.services.serviceOrdersAccess.getById(actor, started.id);
}

async function seedMeasurementUnderReview(context: IdempotencyRetryTestContext, actor: UatActor) {
  const ready = await seedReadyToComplete(context, actor);
  const completed = await context.services.executionAccess.complete(actor, ready.id, {
    rowVersion: ready.rowVersion,
  });
  const measurement = await context.services.measurementsAccess.create(actor, completed.id);
  const submitted = await context.services.measurementsAccess.submit(actor, completed.id, measurement.id, {
    rowVersion: measurement.rowVersion,
  });
  const reviewed = await context.services.measurementsAccess.startReview(actor, completed.id, measurement.id, {
    rowVersion: submitted.rowVersion,
  });
  const reviewer = await seedReviewerActor(context.services, actor.identityId);
  return { completed, measurement, reviewed, reviewer };
}

describe('Idempotency, timeout, retry & double-submit (PostgreSQL integration)', () => {
  let context: IdempotencyRetryTestContext;
  let actor: UatActor;

  beforeAll(async () => {
    context = await createIdempotencyRetryTestContext();
  }, 120_000);

  afterAll(async () => {
    await context.close();
  });

  beforeEach(async () => {
    await context.resetDatabase();
    actor = await context.seedAdminActor();
  }, 120_000);

  describe('lost response — commit then client retry', () => {
    it('keeps a single service order when convert commits and client retries', async () => {
      const { approved, request } = await seedApprovedServiceRequest(context.services, actor);
      const rowVersion = approved.serviceRequest.rowVersion;

      const first = await context.services.serviceRequestsAccess.convert(actor, request.serviceRequest.id, {
        rowVersion,
      });
      expect(first.serviceRequest.status).toBe(SERVICE_REQUEST_STATUSES.Converted);

      await expect(
        context.services.serviceRequestsAccess.convert(actor, request.serviceRequest.id, { rowVersion }),
      ).rejects.toMatchObject({ code: REQUESTS_ERROR_CODES.INVALID_STATE });

      const orders = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM so.service_orders WHERE service_request_id = $1`,
        [request.serviceRequest.id],
      );
      expect(orders.rows[0]?.count).toBe('1');
      expect(first.serviceRequest.convertedServiceOrderId).toBeTruthy();
    });

    it('keeps a single release when response is lost after commit', async () => {
      const { prepared } = await seedPreparedServiceOrder(context.services, actor);
      context.faultPort.setActiveHook(FAULT_HOOKS.ServiceOrderReleaseAfterCommitBeforeAudit);

      await expect(
        context.services.serviceOrdersAccess.release(actor, prepared.id, {
          rowVersion: prepared.rowVersion,
        }),
      ).rejects.toBeInstanceOf(InjectedFaultError);

      context.faultPort.clear();

      const current = await context.services.serviceOrdersAccess.getById(actor, prepared.id);
      expect(current.status).toBe(SERVICE_ORDER_STATUSES.Released);

      const history = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM so.service_order_history_events
         WHERE service_order_id = $1 AND event_type = 'RELEASED'`,
        [prepared.id],
      );
      expect(history.rows[0]?.count).toBe('1');

      await expect(
        context.services.serviceOrdersAccess.release(actor, prepared.id, {
          rowVersion: prepared.rowVersion,
        }),
      ).rejects.toMatchObject({ code: SERVICE_ORDERS_ERROR_CODES.INVALID_STATE });
    });

    it('returns idempotent completion when client retries after successful complete', async () => {
      const ready = await seedReadyToComplete(context, actor);
      const idempotencyKey = `complete-lost-${crypto.randomUUID()}`;

      const first = await context.services.executionAccess.complete(actor, ready.id, {
        rowVersion: ready.rowVersion,
        idempotencyKey,
      });
      const second = await context.services.executionAccess.complete(actor, ready.id, {
        rowVersion: ready.rowVersion,
        idempotencyKey,
      });

      expect(second.status).toBe(SERVICE_ORDER_STATUSES.Completed);
      expect(second.id).toBe(first.id);

      const history = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM so.service_order_history_events
         WHERE service_order_id = $1 AND event_type = 'COMPLETED'`,
        [ready.id],
      );
      expect(history.rows[0]?.count).toBe('1');
    });

    it('returns idempotent approval when client retries measurement approve', async () => {
      const { completed, measurement, reviewed, reviewer } = await seedMeasurementUnderReview(context, actor);
      const idempotencyKey = `approve-lost-${crypto.randomUUID()}`;

      const first = await context.services.measurementsAccess.approve(reviewer, completed.id, measurement.id, {
        rowVersion: reviewed.rowVersion,
        idempotencyKey,
      });
      const second = await context.services.measurementsAccess.approve(reviewer, completed.id, measurement.id, {
        rowVersion: reviewed.rowVersion,
        idempotencyKey,
      });

      expect(second.status).toBe(MEASUREMENT_STATUSES.Approved);
      expect(second.id).toBe(first.id);

      const history = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM msr.measurement_history_events
         WHERE measurement_id = $1 AND event_type = 'APPROVED'`,
        [measurement.id],
      );
      expect(history.rows[0]?.count).toBe('1');
    });

    it('returns idempotent billing when client retries prepare', async () => {
      const { completed, approved } = await seedApprovedMeasurement(context.services, actor);
      const idempotencyKey = `billing-lost-${crypto.randomUUID()}`;

      const first = await context.services.billingAccess.prepare(actor, completed.id, {
        measurementId: approved.id,
        paymentTerms: '30 DDL',
        idempotencyKey,
      });
      const second = await context.services.billingAccess.prepare(actor, completed.id, {
        measurementId: approved.id,
        paymentTerms: '30 DDL',
        idempotencyKey,
      });

      expect(second.id).toBe(first.id);

      const records = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM bil.billing_records WHERE measurement_id = $1`,
        [approved.id],
      );
      expect(records.rows[0]?.count).toBe('1');
    });

    it('returns idempotent billing document when client retries finalize', async () => {
      const { completed, billing } = await seedBillingReady(context.services, actor);
      const idempotencyKey = `doc-lost-${crypto.randomUUID()}`;

      const first = await context.services.billingDocumentAccess.issue(actor, completed.id, billing.id, {
        idempotencyKey,
      });
      const second = await context.services.billingDocumentAccess.issue(actor, completed.id, billing.id, {
        idempotencyKey,
      });

      expect(second.id).toBe(first.id);

      const docs = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM bil.billing_documents WHERE billing_record_id = $1`,
        [billing.id],
      );
      expect(docs.rows[0]?.count).toBe('1');
    });
  });

  describe('idempotency key contract', () => {
    it('returns the same logical result for same key and payload on billing prepare', async () => {
      const { completed, approved } = await seedApprovedMeasurement(context.services, actor);
      const idempotencyKey = `billing-idem-${crypto.randomUUID()}`;
      const payload = {
        measurementId: approved.id,
        paymentTerms: '30 DDL',
        idempotencyKey,
      };

      const first = await context.services.billingAccess.prepare(actor, completed.id, payload);
      const second = await context.services.billingAccess.prepare(actor, completed.id, payload);
      expect(second.id).toBe(first.id);
    });

    it('rejects concurrent divergent payload with the same idempotency key', async () => {
      const client = await seedClient(context.services, actor);
      const published = await seedPublishedService(context.services, actor);
      const idempotencyKey = `sr-conflict-${crypto.randomUUID()}`;

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

      const count = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM sr.service_requests WHERE idempotency_key = $1`,
        [idempotencyKey],
      );
      expect(count.rows[0]?.count).toBe('1');
    });

    it('executes billing prepare once under concurrent identical keys', async () => {
      const { completed, approved } = await seedApprovedMeasurement(context.services, actor);
      const idempotencyKey = `billing-concurrent-${crypto.randomUUID()}`;
      const payload = {
        measurementId: approved.id,
        paymentTerms: '30 DDL',
        idempotencyKey,
      };

      const results = await runWithStartLatch(2, [
        () => context.services.billingAccess.prepare(actor, completed.id, payload),
        () => context.services.billingAccess.prepare(actor, completed.id, payload),
      ]);

      expect(countFulfilled(results)).toBe(2);

      const records = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM bil.billing_records WHERE measurement_id = $1`,
        [approved.id],
      );
      expect(records.rows[0]?.count).toBe('1');
    });
  });

  describe('timeout — reconcilable outcomes', () => {
    it('allows retry after timeout before processing begins', async () => {
      const { completed, approved } = await seedApprovedMeasurement(context.services, actor);
      const idempotencyKey = `billing-timeout-before-${crypto.randomUUID()}`;

      context.faultPort.setActiveHook(FAULT_HOOKS.DbConnectionRefused);
      await expect(
        context.services.billingAccess.prepare(actor, completed.id, {
          measurementId: approved.id,
          paymentTerms: '30 DDL',
          idempotencyKey,
        }),
      ).rejects.toBeTruthy();
      context.faultPort.clear();

      const billing = await context.services.billingAccess.prepare(actor, completed.id, {
        measurementId: approved.id,
        paymentTerms: '30 DDL',
        idempotencyKey,
      });

      const records = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM bil.billing_records WHERE measurement_id = $1`,
        [approved.id],
      );
      expect(records.rows[0]?.count).toBe('1');
      expect(billing.id).toBeTruthy();
    });

    it('rolls back and retries cleanly when timeout happens during processing', async () => {
      const { completed, approved } = await seedApprovedMeasurement(context.services, actor);
      const idempotencyKey = `billing-timeout-during-${crypto.randomUUID()}`;
      context.faultPort.setActiveHook(FAULT_HOOKS.BillingPrepareAfterHeaderBeforeItems);

      await expect(
        context.services.billingAccess.prepare(actor, completed.id, {
          measurementId: approved.id,
          paymentTerms: '30 DDL',
          idempotencyKey,
        }),
      ).rejects.toBeInstanceOf(InjectedFaultError);

      context.faultPort.clear();

      const billing = await context.services.billingAccess.prepare(actor, completed.id, {
        measurementId: approved.id,
        paymentTerms: '30 DDL',
        idempotencyKey,
      });

      const records = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM bil.billing_records WHERE measurement_id = $1`,
        [approved.id],
      );
      expect(records.rows[0]?.count).toBe('1');
      expect(billing.id).toBeTruthy();
    });

    it('reconciles via read when timeout happens after commit on release', async () => {
      const { prepared } = await seedPreparedServiceOrder(context.services, actor);
      context.faultPort.setActiveHook(FAULT_HOOKS.ServiceOrderReleaseAfterCommitBeforeAudit);

      await expect(
        context.services.serviceOrdersAccess.release(actor, prepared.id, {
          rowVersion: prepared.rowVersion,
        }),
      ).rejects.toBeInstanceOf(InjectedFaultError);

      context.faultPort.clear();

      const reconciled = await context.services.serviceOrdersAccess.getById(actor, prepared.id);
      expect(reconciled.status).toBe(SERVICE_ORDER_STATUSES.Released);
    });
  });

  describe('external side effect reconciliation', () => {
    it('reuses billing document idempotency when finalize is retried after successful issue', async () => {
      const { completed, billing } = await seedBillingReady(context.services, actor);
      const idempotencyKey = `doc-reconcile-${crypto.randomUUID()}`;

      const issued = await context.services.billingDocumentAccess.issue(actor, completed.id, billing.id, {
        idempotencyKey,
      });

      await expect(
        context.services.billingDocumentAccess.issue(actor, completed.id, billing.id, {
          idempotencyKey: `other-${crypto.randomUUID()}`,
        }),
      ).rejects.toBeTruthy();

      const retried = await context.services.billingDocumentAccess.issue(actor, completed.id, billing.id, {
        idempotencyKey,
      });

      expect(retried.id).toBe(issued.id);

      const docs = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM bil.billing_documents WHERE billing_record_id = $1`,
        [billing.id],
      );
      expect(docs.rows[0]?.count).toBe('1');
    });
  });

  describe('outbox idempotency', () => {
    it('persists a single outbox event when release commits once and client reconciles', async () => {
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

    it('enforces unique outbox idempotency keys per business event', async () => {
      const { prepared } = await seedPreparedServiceOrder(context.services, actor);
      await context.services.serviceOrdersAccess.release(actor, prepared.id, {
        rowVersion: prepared.rowVersion,
      });

      const uniqueness = await context.pool.query<{ total: string; distinct_keys: string }>(
        `SELECT COUNT(*)::text AS total,
                COUNT(DISTINCT idempotency_key)::text AS distinct_keys
         FROM evt.outbox_events
         WHERE aggregate_id = $1`,
        [prepared.id],
      );
      expect(uniqueness.rows[0]?.total).toBe(uniqueness.rows[0]?.distinct_keys);
      expect(Number(uniqueness.rows[0]?.total)).toBeGreaterThan(0);
    });
  });
});

describe('Integration inbox deduplication (PostgreSQL integration)', () => {
  let pool: Pool;
  let receiveService: IntegrationInboxReceiveService;
  let processor: IntegrationInboxProcessorService;
  let repository: IntegrationInboxRepository;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for inbox deduplication tests.');
    }

    process.env['DATABASE_URL'] = testDatabaseUrl;

    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, IntegrationsInboxModule],
    }).compile();

    await module.init();

    receiveService = module.get(IntegrationInboxReceiveService);
    processor = module.get(IntegrationInboxProcessorService);
    repository = module.get(IntegrationInboxRepository);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await pool.query(`
      TRUNCATE TABLE
        int.integration_inbox_effects,
        int.integration_inbox
      RESTART IDENTITY CASCADE
    `);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('does not duplicate business effects when the same inbox message is processed repeatedly', async () => {
    const externalMessageId = `idem-inbox-${crypto.randomUUID()}`;
    const payload = { amount: 250 };

    const first = await receiveService.receive({
      provider: 'idem-provider',
      externalMessageId,
      eventType: TEST_INBOX_EVENT_TYPE,
      payload,
    });
    const second = await receiveService.receive({
      provider: 'idem-provider',
      externalMessageId,
      eventType: TEST_INBOX_EVENT_TYPE,
      payload,
    });

    expect(first.outcome).toBe('created');
    expect(second.outcome).toBe('duplicate');

    await processor.processBatch('idem-worker', 10);
    await processor.processBatch('idem-worker', 10);

    expect(await repository.countEffects()).toBe(1);
  });
});
