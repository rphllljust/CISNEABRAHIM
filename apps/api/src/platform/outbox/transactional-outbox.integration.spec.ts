import { Test, TestingModule } from '@nestjs/testing';
import { Pool, type PoolClient } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DOMAIN_EVENT_TYPES } from '../../events/domain/domain-event-type';
import { buildServiceRequestSubmittedPayloadV1 } from '../../events/domain/event-payloads.v1';
import { DomainEventsRepository } from '../../events/repositories/domain-events.repository';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { OUTBOX_EVENT_STATUSES } from './domain/outbox-status';
import { OutboxModule } from './outbox.module';
import { OutboxRepository } from './repositories/outbox.repository';
import { OutboxPublisherService } from './services/outbox-publisher.service';

describe('Transactional outbox PostgreSQL integration', () => {
  let pool: Pool;
  let outboxRepository: OutboxRepository;
  let publisher: OutboxPublisherService;
  let domainEventsRepository: DomainEventsRepository;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for transactional outbox integration tests.');
    }

    process.env['DATABASE_URL'] = testDatabaseUrl;

    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, OutboxModule],
    }).compile();

    outboxRepository = module.get(OutboxRepository);
    publisher = module.get(OutboxPublisherService);
    domainEventsRepository = module.get(DomainEventsRepository);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await pool.query(`
      TRUNCATE TABLE
        evt.notification_intents,
        evt.domain_events,
        evt.outbox_events,
        plt.background_jobs
      RESTART IDENTITY CASCADE
    `);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('rolls back outbox inserts when the business transaction fails', async () => {
    const client: PoolClient = await pool.connect();
    const idempotencyKey = `outbox:rollback:${crypto.randomUUID()}`;
    try {
      await client.query('BEGIN');
      await outboxRepository.append(
        {
          eventType: DOMAIN_EVENT_TYPES.ServiceRequestSubmitted,
          aggregateType: 'service-request',
          aggregateId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          payload: buildServiceRequestSubmittedPayloadV1({
            serviceRequestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            unitId: 'unit-outbox-a',
            clientId: null,
            submittedAt: '2026-08-29T12:00:00.000Z',
          }),
          occurredAt: '2026-08-29T12:00:00.000Z',
          idempotencyKey,
        },
        client,
      );
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }

    const stored = await outboxRepository.findByIdempotencyKey(idempotencyKey);
    expect(stored).toBeNull();
  });

  it('persists committed outbox events for asynchronous publishing', async () => {
    const client: PoolClient = await pool.connect();
    const idempotencyKey = `outbox:committed:${crypto.randomUUID()}`;
    try {
      await client.query('BEGIN');
      await outboxRepository.append(
        {
          eventType: DOMAIN_EVENT_TYPES.ServiceRequestSubmitted,
          aggregateType: 'service-request',
          aggregateId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          payload: buildServiceRequestSubmittedPayloadV1({
            serviceRequestId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            unitId: 'unit-outbox-b',
            clientId: null,
            submittedAt: '2026-08-29T12:05:00.000Z',
          }),
          occurredAt: '2026-08-29T12:05:00.000Z',
          idempotencyKey,
        },
        client,
      );
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    const stored = await outboxRepository.findByIdempotencyKey(idempotencyKey);
    expect(stored?.status).toBe(OUTBOX_EVENT_STATUSES.Pending);

    await publisher.publishBatch('outbox-worker-a', 10);
    const published = await outboxRepository.findByIdempotencyKey(idempotencyKey);
    expect(published?.status).toBe(OUTBOX_EVENT_STATUSES.Published);

    const domainEvent = await domainEventsRepository.findByIdempotencyKey(idempotencyKey);
    expect(domainEvent?.event_type).toBe(DOMAIN_EVENT_TYPES.ServiceRequestSubmitted);
  });

  it('prevents duplicate workers from processing the same outbox row', async () => {
    const idempotencyKey = `outbox:duplicate-worker:${crypto.randomUUID()}`;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await outboxRepository.append(
        {
          eventType: DOMAIN_EVENT_TYPES.BillingReady,
          aggregateType: 'billing-record',
          aggregateId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          payload: {
            schemaVersion: 1,
            billingRecordId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            serviceOrderId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
            measurementId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
            unitId: 'unit-outbox-c',
            totalAmount: '100.0000',
            preparedAt: '2026-08-29T12:10:00.000Z',
          },
          occurredAt: '2026-08-29T12:10:00.000Z',
          idempotencyKey,
        },
        client,
      );
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    const [workerA, workerB] = await Promise.all([
      outboxRepository.claimPending('worker-a', 1, 60_000),
      outboxRepository.claimPending('worker-b', 1, 60_000),
    ]);
    const claimed = [...workerA, ...workerB];
    expect(claimed).toHaveLength(1);
  });

  it('remains safe to retry after external publish side effects', async () => {
    const idempotencyKey = `outbox:crash:${crypto.randomUUID()}`;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await outboxRepository.append(
        {
          eventType: DOMAIN_EVENT_TYPES.MeasurementSubmitted,
          aggregateType: 'measurement',
          aggregateId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
          payload: {
            schemaVersion: 1,
            measurementId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
            serviceOrderId: '11111111-1111-4111-8111-111111111111',
            unitId: 'unit-outbox-d',
            submittedAt: '2026-08-29T12:15:00.000Z',
          },
          occurredAt: '2026-08-29T12:15:00.000Z',
          idempotencyKey,
        },
        client,
      );
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    const claimed = await outboxRepository.claimPending('worker-crash', 1, 60_000);
    const event = claimed[0];
    expect(event).toBeTruthy();

    await domainEventsRepository.recordDomainEvent({
      eventType: event!.event_type,
      aggregateType: event!.aggregate_type,
      aggregateId: event!.aggregate_id,
      payload: event!.payload,
      occurredAt: event!.occurred_at,
      idempotencyKey: event!.idempotency_key,
    });

    await publisher.publishClaimedEvent(event!);

    const domainCount = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM evt.domain_events WHERE idempotency_key = $1`,
      [idempotencyKey],
    );
    expect(domainCount.rows[0]?.count).toBe('1');

    const outbox = await outboxRepository.findByIdempotencyKey(idempotencyKey);
    expect(outbox?.status).toBe(OUTBOX_EVENT_STATUSES.Published);
  });

  it('schedules retry and eventually publishes after a transient failure', async () => {
    const idempotencyKey = `outbox:retry:${crypto.randomUUID()}`;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await outboxRepository.append(
        {
          eventType: DOMAIN_EVENT_TYPES.ServiceRequestSubmitted,
          aggregateType: 'service-request',
          aggregateId: '44444444-4444-4444-8444-444444444444',
          payload: buildServiceRequestSubmittedPayloadV1({
            serviceRequestId: '44444444-4444-4444-8444-444444444444',
            unitId: 'unit-outbox-e',
            clientId: null,
            submittedAt: '2026-08-29T12:20:00.000Z',
          }),
          occurredAt: '2026-08-29T12:20:00.000Z',
          idempotencyKey,
        },
        client,
      );
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    const claimed = await outboxRepository.claimPending('worker-retry', 1, 60_000);
    const event = claimed[0]!;
    await outboxRepository.scheduleRetry(
      event.id,
      'SIMULATED_TRANSIENT_FAILURE',
      new Date(Date.now() - 1_000).toISOString(),
    );

    const pending = await outboxRepository.findByIdempotencyKey(idempotencyKey);
    expect(pending?.status).toBe(OUTBOX_EVENT_STATUSES.Pending);

    await publisher.publishBatch('worker-retry-2', 10);
    const published = await outboxRepository.findByIdempotencyKey(idempotencyKey);
    expect(published?.status).toBe(OUTBOX_EVENT_STATUSES.Published);
  });

  it('preserves ordering for events on the same aggregate', async () => {
    const orderingKey = 'service-request:33333333-3333-4333-8333-333333333333';
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const [index, suffix] of ['submitted', 'released'].entries()) {
        await outboxRepository.append(
          {
            eventType:
              suffix === 'submitted'
                ? DOMAIN_EVENT_TYPES.ServiceRequestSubmitted
                : DOMAIN_EVENT_TYPES.ServiceOrderReleased,
            aggregateType: 'service-request',
            aggregateId: '33333333-3333-4333-8333-333333333333',
            payload: { schemaVersion: 1, sequence: index },
            occurredAt: new Date(Date.UTC(2026, 7, 29, 12, 25, index)).toISOString(),
            idempotencyKey: `ordering:${orderingKey}:${suffix}`,
            availableAt: new Date(Date.UTC(2026, 7, 29, 12, 25, index)).toISOString(),
          },
          client,
        );
      }
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    await publisher.publishBatch('worker-order', 10);
    const sequences = await outboxRepository.listPublishedSequenceNumbers(orderingKey);
    expect(sequences).toEqual([...sequences].sort((a, b) => a - b));
    expect(sequences.length).toBe(2);
  });
});
