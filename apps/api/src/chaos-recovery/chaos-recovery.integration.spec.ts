import { Test, TestingModule } from '@nestjs/testing';
import { Pool, type PoolClient } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { seedBillingReady } from '../concurrency/concurrency-seeds';
import { CONTACT_PURPOSES } from '../clients/domain/client-status';
import { DOMAIN_EVENT_TYPES } from '../events/domain/domain-event-type';
import { buildServiceRequestSubmittedPayloadV1 } from '../events/domain/event-payloads.v1';
import { DomainEventsRepository } from '../events/repositories/domain-events.repository';
import {
  createFailureInjectionTestContext,
  type FailureInjectionTestContext,
} from '../failure-injection/failure-injection-harness';
import { nextSyntheticCnpj } from '../master-business/synthetic-test-data';
import {
  INTEGRATION_ERROR_CLASSES,
  IntegrationProviderError,
} from '../integrations/acl/domain/integration-error';
import { TEST_INBOX_EVENT_TYPE } from '../integrations/inbox/handlers/test-integration-inbox.handler';
import {
  INTEGRATION_INBOX_ERROR_CLASSES,
  INTEGRATION_INBOX_STATUSES,
} from '../integrations/inbox/domain/inbox-status';
import { IntegrationsInboxModule } from '../integrations/inbox/integrations-inbox.module';
import { IntegrationInboxRepository } from '../integrations/inbox/repositories/integration-inbox.repository';
import { IntegrationInboxProcessorService } from '../integrations/inbox/services/integration-inbox-processor.service';
import { IntegrationInboxReceiveService } from '../integrations/inbox/services/integration-inbox-receive.service';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { EventsModule } from '../events/events.module';
import { NOTIFICATION_CHANNELS } from '../notifications/domain/notification-channel';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationChannelRegistry } from '../notifications/services/notification-channel.registry';
import { NotificationDeliveryService } from '../notifications/services/notification-delivery.service';
import { ControllableNotificationChannelProvider } from '../notifications/testing/controllable-channel.provider';
import { FAULT_HOOKS } from '../platform/fault-injection/fault-hook.ids';
import { BACKGROUND_JOB_KINDS, BACKGROUND_JOB_STATUSES } from '../platform/background-jobs/domain/background-job-kind';
import type { BackgroundJobHandler, JobHandlerContext } from '../platform/background-jobs/domain/job-handler.types';
import { PermanentJobError, TransientJobError } from '../platform/background-jobs/domain/job-errors';
import { BackgroundJobsModule } from '../platform/background-jobs/background-jobs.module';
import { BackgroundJobsRepository } from '../platform/background-jobs/repositories/background-jobs.repository';
import { BackgroundJobEnqueueService } from '../platform/background-jobs/services/background-job-enqueue.service';
import { BackgroundJobHandlerRegistry } from '../platform/background-jobs/services/background-job-handler.registry';
import { BackgroundWorkerService } from '../platform/background-jobs/services/background-worker.service';
import { OUTBOX_EVENT_STATUSES } from '../platform/outbox/domain/outbox-status';
import { OutboxModule } from '../platform/outbox/outbox.module';
import { OutboxRepository } from '../platform/outbox/repositories/outbox.repository';
import { OutboxPublisherService } from '../platform/outbox/services/outbox-publisher.service';
import { OutboxPublisherWorkerService } from '../platform/outbox/services/outbox-publisher.worker.service';
import { IntegrationInboxProcessorWorkerService } from '../integrations/inbox/services/integration-inbox-processor.worker.service';
import type { UatActor } from '../uat/uat-vertical-runner';

const previousOutboxPublisherEnabled = process.env['OUTBOX_PUBLISHER_ENABLED'];
const previousInboxProcessorEnabled = process.env['INBOX_PROCESSOR_ENABLED'];
process.env['OUTBOX_PUBLISHER_ENABLED'] = 'false';
process.env['INBOX_PROCESSOR_ENABLED'] = 'false';

function restorePollerEnv(): void {
  if (previousOutboxPublisherEnabled === undefined) {
    delete process.env['OUTBOX_PUBLISHER_ENABLED'];
  } else {
    process.env['OUTBOX_PUBLISHER_ENABLED'] = previousOutboxPublisherEnabled;
  }
  if (previousInboxProcessorEnabled === undefined) {
    delete process.env['INBOX_PROCESSOR_ENABLED'];
  } else {
    process.env['INBOX_PROCESSOR_ENABLED'] = previousInboxProcessorEnabled;
  }
}

type TestJobBehavior = 'success' | 'transient' | 'permanent' | 'slow';

class ChaosIntegrationJobHandler implements BackgroundJobHandler {
  readonly jobKind = BACKGROUND_JOB_KINDS.Integration;
  constructor(private readonly slowDelayMs = 300) {}

  async handle(context: JobHandlerContext): Promise<void> {
    const behavior = context.payload['behavior'] as TestJobBehavior | undefined;
    if (behavior === 'transient') {
      throw new TransientJobError('SIMULATED_TRANSIENT_FAILURE');
    }
    if (behavior === 'permanent') {
      throw new PermanentJobError('SIMULATED_PERMANENT_FAILURE');
    }
    if (behavior === 'slow') {
      await new Promise((resolve) => setTimeout(resolve, this.slowDelayMs));
    }
  }
}

async function appendOutboxEvent(
  outboxRepository: OutboxRepository,
  pool: Pool,
  suffix: string,
): Promise<string> {
  const client: PoolClient = await pool.connect();
  const aggregateId = crypto.randomUUID();
  const idempotencyKey = `chaos:outbox:${suffix}:${aggregateId}`;
  try {
    await client.query('BEGIN');
    await outboxRepository.append(
      {
        eventType: DOMAIN_EVENT_TYPES.ServiceRequestSubmitted,
        aggregateType: 'service-request',
        aggregateId,
        payload: buildServiceRequestSubmittedPayloadV1({
          serviceRequestId: aggregateId,
          unitId: 'unit-chaos',
          clientId: null,
          submittedAt: '2026-09-01T00:00:00.000Z',
        }),
        occurredAt: '2026-09-01T00:00:00.000Z',
        availableAt: '2026-09-01T00:00:00.000Z',
        idempotencyKey,
      },
      client,
    );
    await client.query('COMMIT');
  } finally {
    client.release();
  }
  return idempotencyKey;
}

async function snapshotOutbox(pool: Pool): Promise<unknown[]> {
  const result = await pool.query<Record<string, unknown>>(
    `SELECT status, lease_owner, available_at, attempts, last_error, idempotency_key
     FROM evt.outbox_events
     ORDER BY sequence_number`,
  );
  return result.rows;
}

describe('Chaos, async processing & recovery (controlled environment)', () => {
  afterAll(() => {
    restorePollerEnv();
  });

  describe('dependencies', () => {
    let context: FailureInjectionTestContext;
    let dependenciesModule: TestingModule;
    let actor: UatActor;
    let deliveryService: NotificationDeliveryService;
    let channelRegistry: NotificationChannelRegistry;
    let domainEventsRepository: DomainEventsRepository;
    let inboxReceive: IntegrationInboxReceiveService;
    let inboxProcessor: IntegrationInboxProcessorService;
    let inboxRepository: IntegrationInboxRepository;

    beforeAll(async () => {
      context = await createFailureInjectionTestContext();
      process.env['DATABASE_URL'] = process.env['TEST_DATABASE_URL'];

      dependenciesModule = await Test.createTestingModule({
        imports: [DatabaseModule, EventsModule, NotificationsModule, IntegrationsInboxModule],
      }).compile();
      await dependenciesModule.init();

      deliveryService = dependenciesModule.get(NotificationDeliveryService);
      channelRegistry = dependenciesModule.get(NotificationChannelRegistry);
      domainEventsRepository = dependenciesModule.get(DomainEventsRepository);
      inboxReceive = dependenciesModule.get(IntegrationInboxReceiveService);
      inboxProcessor = dependenciesModule.get(IntegrationInboxProcessorService);
      inboxRepository = dependenciesModule.get(IntegrationInboxRepository);
    }, 120_000);

    afterAll(async () => {
      await dependenciesModule.close();
      await context.close();
    });

    beforeEach(async () => {
      context.faultPort.clear();
      context.faultingStorage.reset();
      await context.resetDatabase();
      actor = await context.seedAdminActor();
      await context.pool.query(`
        TRUNCATE TABLE
          int.integration_inbox_effects,
          int.integration_inbox,
          ntf.delivery_attempts,
          ntf.notifications,
          evt.notification_intents,
          evt.domain_events
        RESTART IDENTITY CASCADE
      `);
    }, 120_000);

    it('rejects operations when PostgreSQL connection is refused', async () => {
      context.faultPort.setActiveHook(FAULT_HOOKS.DbConnectionRefused);
      await expect(
        context.services.clientAccess.create(actor, {
          legalName: 'Chaos DB Fail',
          taxId: nextSyntheticCnpj(),
          contacts: [{ name: 'Ops', purpose: CONTACT_PURPOSES.Operational, phone: '69999990000' }],
        }),
      ).rejects.toBeTruthy();
      const clients = await context.pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM pty.clients`,
      );
      expect(clients.rows[0]?.count).toBe('0');
    });

    it('rejects operations when PostgreSQL pool is unavailable', async () => {
      context.faultPort.setActiveHook(FAULT_HOOKS.DbPoolUnavailable);
      await expect(
        context.services.clientAccess.create(actor, {
          legalName: 'Chaos Pool Fail',
          taxId: nextSyntheticCnpj(),
          contacts: [{ name: 'Ops', purpose: CONTACT_PURPOSES.Operational, phone: '69999990000' }],
        }),
      ).rejects.toBeTruthy();
    });

    it('rejects billing document issuance when object storage upload fails or times out', async () => {
      const { completed, billing } = await seedBillingReady(context.services, actor);

      context.faultingStorage.setFailPut(true);
      await expect(
        context.services.billingDocumentAccess.issue(actor, completed.id, billing.id, {}),
      ).rejects.toBeTruthy();

      context.faultingStorage.reset();
      context.faultingStorage.setTimeoutPut(true);
      await expect(
        context.services.billingDocumentAccess.issue(actor, completed.id, billing.id, {}),
      ).rejects.toBeTruthy();
    });

    it('classifies provider timeout, 429, 500 and 503 as retryable/transient delivery failures', async () => {
      const serviceRequestId = crypto.randomUUID();
      const recorded = await domainEventsRepository.recordDomainEvent({
        eventType: DOMAIN_EVENT_TYPES.ServiceRequestSubmitted,
        aggregateType: 'service-request',
        aggregateId: serviceRequestId,
        payload: buildServiceRequestSubmittedPayloadV1({
          serviceRequestId,
          unitId: 'unit-chaos-provider',
          clientId: null,
          submittedAt: new Date().toISOString(),
        }),
        idempotencyKey: `chaos:provider:${serviceRequestId}`,
      });
      const intentId = recorded.notificationIntentIds[0] as string;

      const provider = new ControllableNotificationChannelProvider(NOTIFICATION_CHANNELS.InApp, 'chaos-provider');
      channelRegistry.register(provider);

      const cases: Array<{ label: string; error: IntegrationProviderError }> = [
        {
          label: 'timeout',
          error: new IntegrationProviderError(INTEGRATION_ERROR_CLASSES.Timeout, 'PROVIDER_TIMEOUT'),
        },
        {
          label: '429',
          error: new IntegrationProviderError(INTEGRATION_ERROR_CLASSES.RateLimit, 'HTTP_429'),
        },
        {
          label: '500',
          error: new IntegrationProviderError(INTEGRATION_ERROR_CLASSES.Transient, 'HTTP_500'),
        },
        {
          label: '503',
          error: new IntegrationProviderError(INTEGRATION_ERROR_CLASSES.Transient, 'HTTP_503'),
        },
      ];

      for (const testCase of cases) {
        provider.dispatch = async () => {
          throw testCase.error;
        };
        await expect(deliveryService.dispatchNotificationIntent(intentId)).rejects.toBeInstanceOf(
          TransientJobError,
        );
        await context.pool.query(`UPDATE evt.notification_intents SET status = 'PENDING' WHERE id = $1::uuid`, [
          intentId,
        ]);
      }
    });

    it('marks malformed inbox payloads without retrying', async () => {
      const received = await inboxReceive.receive({
        provider: 'chaos-provider',
        externalMessageId: `malformed-${crypto.randomUUID()}`,
        eventType: TEST_INBOX_EVENT_TYPE,
        payload: { amount: -1 },
      });
      await inboxProcessor.processBatch('chaos-inbox-worker', 10);
      const stored = await inboxRepository.findById(received.inboxId);
      expect(stored?.status).toBe(INTEGRATION_INBOX_STATUSES.Invalid);
      expect(stored?.error_classification).toBe(INTEGRATION_INBOX_ERROR_CLASSES.InvalidPayload);
    });
  });

  describe('worker lifecycle, outbox, inbox and backpressure', () => {
    let pool: Pool;
    let outboxRepository: OutboxRepository;
    let publisher: OutboxPublisherService;
    let domainEventsRepository: DomainEventsRepository;
    let jobsRepository: BackgroundJobsRepository;
    let enqueueService: BackgroundJobEnqueueService;
    let worker: BackgroundWorkerService;
    let registry: BackgroundJobHandlerRegistry;
    let inboxReceive: IntegrationInboxReceiveService;
    let inboxProcessor: IntegrationInboxProcessorService;
    let inboxRepository: IntegrationInboxRepository;
    let outboxPublisherWorker: OutboxPublisherWorkerService;
    let inboxProcessorWorker: IntegrationInboxProcessorWorkerService;
    let workerModule: TestingModule;
    const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

    beforeAll(async () => {
      if (!testDatabaseUrl) {
        throw new Error('TEST_DATABASE_URL is required for chaos recovery tests.');
      }
      process.env['DATABASE_URL'] = testDatabaseUrl;
      process.env['WORKER_ENABLED'] = 'true';
      process.env['WORKER_ID'] = 'chaos-worker';
      process.env['WORKER_CONCURRENCY'] = '2';
      process.env['WORKER_POLL_INTERVAL_MS'] = '50';
      process.env['WORKER_JOB_TIMEOUT_MS'] = '5000';
      process.env['WORKER_LEASE_DURATION_MS'] = '1500';
      process.env['WORKER_SHUTDOWN_GRACE_MS'] = '3000';
      process.env['WORKER_DEFAULT_MAX_ATTEMPTS'] = '3';
      process.env['WORKER_BACKOFF_BASE_MS'] = '10';
      process.env['WORKER_BACKOFF_MAX_MS'] = '100';
      process.env['OUTBOX_PUBLISHER_ENABLED'] = 'false';
      process.env['INBOX_PROCESSOR_ENABLED'] = 'false';

      workerModule = await Test.createTestingModule({
        imports: [DatabaseModule, OutboxModule, BackgroundJobsModule, IntegrationsInboxModule],
      }).compile();
      await workerModule.init();

      outboxRepository = workerModule.get(OutboxRepository);
      publisher = workerModule.get(OutboxPublisherService);
      outboxPublisherWorker = workerModule.get(OutboxPublisherWorkerService);
      inboxProcessorWorker = workerModule.get(IntegrationInboxProcessorWorkerService);
      domainEventsRepository = workerModule.get(DomainEventsRepository);
      jobsRepository = workerModule.get(BackgroundJobsRepository);
      enqueueService = workerModule.get(BackgroundJobEnqueueService);
      worker = workerModule.get(BackgroundWorkerService);
      registry = workerModule.get(BackgroundJobHandlerRegistry);
      inboxReceive = workerModule.get(IntegrationInboxReceiveService);
      inboxProcessor = workerModule.get(IntegrationInboxProcessorService);
      inboxRepository = workerModule.get(IntegrationInboxRepository);
      registry.register(new ChaosIntegrationJobHandler());
      pool = new Pool({ connectionString: testDatabaseUrl });
    }, 120_000);

    beforeEach(async () => {
      await pool.query(`
        TRUNCATE TABLE
          int.integration_inbox_effects,
          int.integration_inbox,
          evt.notification_intents,
          evt.domain_events,
          evt.outbox_events,
          plt.background_jobs
        RESTART IDENTITY CASCADE
      `);
    });

    afterAll(async () => {
      await outboxPublisherWorker.stop();
      await inboxProcessorWorker.stop();
      await worker.stop();
      await workerModule.close();
      await pool.end();
    });

    it('recovers worker stopped before completing a claimed job', async () => {
      const key = `chaos:worker-before:${crypto.randomUUID()}`;
      const enqueued = await jobsRepository.enqueueJob({
        jobKind: BACKGROUND_JOB_KINDS.Integration,
        idempotencyKey: key,
        payload: { behavior: 'success' },
        maxAttempts: 3,
      });
      const claimed = await jobsRepository.claimJobs('crashed-before-worker', 1, 1);
      expect(claimed).toHaveLength(1);
      expect(claimed[0]?.id).toBe(enqueued.jobId);

      await pool.query(
        `UPDATE plt.background_jobs SET lease_expires_at = NOW() - interval '1 second' WHERE id = $1::uuid`,
        [enqueued.jobId],
      );
      await jobsRepository.releaseExpiredLeases();

      await worker.runOnce();
      await vi.waitFor(async () => {
        const stored = await jobsRepository.findByIdempotencyKey(key);
        expect(stored?.status).toBe(BACKGROUND_JOB_STATUSES.Completed);
      });
    });

    it('remains safe to retry outbox publishing after side effects already happened', async () => {
      const idempotencyKey = `chaos:outbox-after-effect:${crypto.randomUUID()}`;
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await outboxRepository.append(
          {
            eventType: DOMAIN_EVENT_TYPES.MeasurementSubmitted,
            aggregateType: 'measurement',
            aggregateId: crypto.randomUUID(),
            payload: {
              schemaVersion: 1,
              measurementId: crypto.randomUUID(),
              serviceOrderId: crypto.randomUUID(),
              unitId: 'unit-chaos-outbox',
              submittedAt: '2026-09-01T00:00:00.000Z',
            },
            occurredAt: '2026-09-01T00:00:00.000Z',
            availableAt: '2026-09-01T00:00:00.000Z',
            idempotencyKey,
          },
          client,
        );
        await client.query('COMMIT');
      } finally {
        client.release();
      }

      const claimed = await outboxRepository.claimPending('chaos-worker-after-effect', 1, 60_000);
      expect(claimed, JSON.stringify(await snapshotOutbox(pool))).toHaveLength(1);
      const event = claimed[0]!;
      await domainEventsRepository.recordDomainEvent({
        eventType: event.event_type,
        aggregateType: event.aggregate_type,
        aggregateId: event.aggregate_id,
        payload: event.payload,
        occurredAt: event.occurred_at,
        idempotencyKey: event.idempotency_key,
      });
      await publisher.publishClaimedEvent(event);

      const domainCount = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM evt.domain_events WHERE idempotency_key = $1`,
        [idempotencyKey],
      );
      expect(domainCount.rows[0]?.count).toBe('1');
      expect((await outboxRepository.findByIdempotencyKey(idempotencyKey))?.status).toBe(
        OUTBOX_EVENT_STATUSES.Published,
      );
    });

    it('drains outbox backlog after worker restart without losing eligible events', async () => {
      const keys: string[] = [];
      for (let index = 0; index < 5; index++) {
        keys.push(await appendOutboxEvent(outboxRepository, pool, `backlog-a-${index}`));
      }

      const pendingBeforeStop = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM evt.outbox_events WHERE status = 'PENDING'`,
      );
      expect(Number(pendingBeforeStop.rows[0]?.count)).toBe(5);

      for (let index = 0; index < 3; index++) {
        keys.push(await appendOutboxEvent(outboxRepository, pool, `backlog-b-${index}`));
      }

      const pendingWhileStopped = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM evt.outbox_events WHERE status = 'PENDING'`,
      );
      expect(Number(pendingWhileStopped.rows[0]?.count)).toBe(8);

      await publisher.publishBatch('chaos-outbox-recovery', 20);

      const published = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM evt.outbox_events WHERE status = 'PUBLISHED'`,
      );
      expect(Number(published.rows[0]?.count), JSON.stringify(await snapshotOutbox(pool))).toBe(8);

      for (const key of keys) {
        const row = await outboxRepository.findByIdempotencyKey(key);
        expect(row?.status).toBe(OUTBOX_EVENT_STATUSES.Published);
      }

      const lost = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM evt.outbox_events
         WHERE status = 'PENDING'
           AND available_at <= NOW()`,
      );
      expect(Number(lost.rows[0]?.count)).toBe(0);
    });

    it('prevents duplicate outbox and inbox processing across multiple workers', async () => {
      const outboxKey = await appendOutboxEvent(outboxRepository, pool, 'multi-worker-outbox');
      const [outboxA, outboxB] = await Promise.all([
        outboxRepository.claimPending('chaos-outbox-a', 1, 60_000),
        outboxRepository.claimPending('chaos-outbox-b', 1, 60_000),
      ]);
      const claimed = [...outboxA, ...outboxB];
      expect(claimed, JSON.stringify(await snapshotOutbox(pool))).toHaveLength(1);
      await pool.query(
        `UPDATE evt.outbox_events SET lease_expires_at = NOW() - interval '1 second' WHERE id = $1::uuid`,
        [claimed[0]!.id],
      );
      await outboxRepository.releaseExpiredLeases();
      await publisher.publishBatch('chaos-outbox-a', 10);
      expect((await outboxRepository.findByIdempotencyKey(outboxKey))?.status).toBe(
        OUTBOX_EVENT_STATUSES.Published,
      );

      const externalMessageId = `chaos-inbox-multi-${crypto.randomUUID()}`;
      await inboxReceive.receive({
        provider: 'chaos-multi',
        externalMessageId,
        eventType: TEST_INBOX_EVENT_TYPE,
        payload: { amount: 50 },
      });
      const [inboxA, inboxB] = await Promise.all([
        inboxProcessor.processBatch('chaos-inbox-a', 1),
        inboxProcessor.processBatch('chaos-inbox-b', 1),
      ]);
      expect(inboxA + inboxB).toBe(1);
      expect(await inboxRepository.countEffects()).toBe(1);
    });

    it('deduplicates inbox delivery for repeated and concurrent receives', async () => {
      const externalMessageId = `chaos-inbox-repeat-${crypto.randomUUID()}`;
      const payload = { amount: 125 };

      for (let attempt = 0; attempt < 10; attempt++) {
        await inboxReceive.receive({
          provider: 'chaos-repeat',
          externalMessageId,
          eventType: TEST_INBOX_EVENT_TYPE,
          payload,
        });
      }

      await Promise.all(
        Array.from({ length: 5 }, (_, index) =>
          inboxProcessor.processBatch(`chaos-inbox-concurrent-${index}`, 2),
        ),
      );

      expect(await inboxRepository.countEffects()).toBe(1);
      const stored = await inboxRepository.findByProviderAndMessageId('chaos-repeat', externalMessageId);
      expect(stored?.status).toBe(INTEGRATION_INBOX_STATUSES.Processed);
    });

    it('isolates poison messages without blocking the queue', async () => {
      const poisonId = `chaos-poison-${crypto.randomUUID()}`;
      await inboxReceive.receive({
        provider: 'chaos-poison',
        externalMessageId: poisonId,
        eventType: TEST_INBOX_EVENT_TYPE,
        payload: { amount: 10, _simulatePermanentFailure: true },
      });
      await inboxProcessor.processBatch('chaos-poison-worker', 10);
      const poison = await inboxRepository.findByProviderAndMessageId('chaos-poison', poisonId);
      expect(poison?.status).toBe(INTEGRATION_INBOX_STATUSES.Failed);

      const healthyId = `chaos-healthy-${crypto.randomUUID()}`;
      await inboxReceive.receive({
        provider: 'chaos-poison',
        externalMessageId: healthyId,
        eventType: TEST_INBOX_EVENT_TYPE,
        payload: { amount: 20 },
      });
      await inboxProcessor.processBatch('chaos-poison-worker', 10);
      expect(await inboxRepository.countEffects()).toBe(1);

      const deadKey = `chaos:job-poison:${crypto.randomUUID()}`;
      await jobsRepository.enqueueJob({
        jobKind: BACKGROUND_JOB_KINDS.Integration,
        idempotencyKey: deadKey,
        payload: { behavior: 'permanent' },
        maxAttempts: 1,
      });
      await worker.runOnce();
      expect((await jobsRepository.findByIdempotencyKey(deadKey))?.status).toBe(
        BACKGROUND_JOB_STATUSES.Failed,
      );

      const healthyJobKey = `chaos:job-healthy:${crypto.randomUUID()}`;
      await enqueueService.enqueue({
        jobKind: BACKGROUND_JOB_KINDS.Integration,
        idempotencyKey: healthyJobKey,
        payload: { behavior: 'success' },
      });
      await worker.runOnce();
      expect((await jobsRepository.findByIdempotencyKey(healthyJobKey))?.status).toBe(
        BACKGROUND_JOB_STATUSES.Completed,
      );
    });

    it('applies backpressure by growing then draining the job queue', async () => {
      registry.register(new ChaosIntegrationJobHandler(500));
      const keys = Array.from({ length: 6 }, () => `chaos:backpressure:${crypto.randomUUID()}`);
      for (const key of keys) {
        await enqueueService.enqueue({
          jobKind: BACKGROUND_JOB_KINDS.Integration,
          idempotencyKey: key,
          payload: { behavior: 'slow' },
        });
      }

      const runPromise = worker.runOnce();
      await vi.waitFor(async () => {
        const running = await jobsRepository.countByStatus(BACKGROUND_JOB_STATUSES.Running);
        expect(running).toBeGreaterThanOrEqual(1);
      });
      await runPromise;

      for (let attempt = 0; attempt < 12; attempt++) {
        const pending = await jobsRepository.countByStatus(BACKGROUND_JOB_STATUSES.Pending);
        const running = await jobsRepository.countByStatus(BACKGROUND_JOB_STATUSES.Running);
        if (pending + running === 0) {
          break;
        }
        await pool.query(
          `UPDATE plt.background_jobs SET run_after = NOW() - interval '1 second'
           WHERE status IN ('PENDING', 'RUNNING')`,
        );
        await jobsRepository.releaseExpiredLeases();
        await worker.runOnce();
      }

      const pending = await jobsRepository.countByStatus(BACKGROUND_JOB_STATUSES.Pending);
      const running = await jobsRepository.countByStatus(BACKGROUND_JOB_STATUSES.Running);
      expect(pending + running).toBe(0);

      for (const key of keys) {
        expect((await jobsRepository.findByIdempotencyKey(key))?.status).toBe(
          BACKGROUND_JOB_STATUSES.Completed,
        );
      }
    });

    it('recovers automatically after dependencies are restored with no eternal PROCESSING state', async () => {
      const key = `chaos:recovery:${crypto.randomUUID()}`;
      const enqueued = await jobsRepository.enqueueJob({
        jobKind: BACKGROUND_JOB_KINDS.Integration,
        idempotencyKey: key,
        payload: { behavior: 'success' },
        maxAttempts: 3,
      });
      await jobsRepository.claimJobs('chaos-stale-worker', 1, 1);
      await pool.query(
        `UPDATE plt.background_jobs SET lease_expires_at = NOW() - interval '1 second' WHERE id = $1::uuid`,
        [enqueued.jobId],
      );
      await jobsRepository.releaseExpiredLeases();

      const staleRunning = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM plt.background_jobs
         WHERE status = 'RUNNING' AND lease_expires_at < NOW()`,
      );
      expect(Number(staleRunning.rows[0]?.count)).toBe(0);

      await worker.runOnce();
      expect((await jobsRepository.findByIdempotencyKey(key))?.status).toBe(
        BACKGROUND_JOB_STATUSES.Completed,
      );

      const outboxKey = await appendOutboxEvent(outboxRepository, pool, 'recovery-outbox');
      await publisher.publishBatch('chaos-recovery-outbox', 10);
      expect((await outboxRepository.findByIdempotencyKey(outboxKey))?.status).toBe(
        OUTBOX_EVENT_STATUSES.Published,
      );
    });

    it('completes in-flight work when worker shuts down during slow jobs', async () => {
      registry.register(new ChaosIntegrationJobHandler(700));
      const key = `chaos:worker-during:${crypto.randomUUID()}`;
      await enqueueService.enqueue({
        jobKind: BACKGROUND_JOB_KINDS.Integration,
        idempotencyKey: key,
        payload: { behavior: 'slow' },
      });

      const runPromise = worker.runOnce();
      const stopPromise = worker.stop();
      await Promise.all([runPromise, stopPromise]);

      const stored = await jobsRepository.findByIdempotencyKey(key);
      expect(stored?.status).toBe(BACKGROUND_JOB_STATUSES.Completed);
    });
  });
});
