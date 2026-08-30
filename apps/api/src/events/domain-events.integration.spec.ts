import { truncateIdentityAndAuthorizationTables } from '@cisne/database';
import { Test, TestingModule } from '@nestjs/testing';
import { Pool, type PoolClient } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { DOMAIN_EVENT_TYPES } from './domain/domain-event-type';
import { buildServiceRequestSubmittedPayloadV1 } from './domain/event-payloads.v1';
import { EventsModule } from './events.module';
import { DomainEventsRepository } from './repositories/domain-events.repository';
import { DomainEventsRecorderService } from './services/domain-events-recorder.service';

describe('Domain events PostgreSQL integration', () => {
  let pool: Pool;
  let repository: DomainEventsRepository;
  let recorder: DomainEventsRecorderService;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for domain events integration tests.');
    }

    process.env['DATABASE_URL'] = testDatabaseUrl;

    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, EventsModule],
    }).compile();

    repository = module.get(DomainEventsRepository);
    recorder = module.get(DomainEventsRecorderService);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE evt.notification_intents, evt.domain_events RESTART IDENTITY CASCADE');
    await truncateIdentityAndAuthorizationTables(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('records the correct domain event and notification intent', async () => {
    const serviceRequestId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const payload = buildServiceRequestSubmittedPayloadV1({
      serviceRequestId,
      unitId: 'unit-events-a',
      clientId: null,
      submittedAt: '2026-08-29T12:00:00.000Z',
    });

    const result = await repository.recordDomainEvent({
      eventType: DOMAIN_EVENT_TYPES.ServiceRequestSubmitted,
      aggregateType: 'service-request',
      aggregateId: serviceRequestId,
      payload: payload,
      occurredAt: payload.submittedAt,
      idempotencyKey: `service-request:${serviceRequestId}:submitted`,
    });

    expect(result.outcome).toBe('created');
    expect(result.notificationIntentIds.length).toBe(1);

    const stored = await repository.findByIdempotencyKey(`service-request:${serviceRequestId}:submitted`);
    expect(stored?.event_type).toBe(DOMAIN_EVENT_TYPES.ServiceRequestSubmitted);
    expect(stored?.payload_version).toBe(1);
    expect(stored?.payload).toMatchObject({
      schemaVersion: 1,
      serviceRequestId,
      unitId: 'unit-events-a',
    });

    const intents = await repository.listNotificationIntents(result.domainEventId);
    expect(intents).toHaveLength(1);
    expect(intents[0]?.status).toBe('PENDING');
    expect(intents[0]?.template_key).toBe('service-request.submitted.review');
  });

  it('does not duplicate events for the same idempotency key', async () => {
    const serviceRequestId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const input = {
      eventType: DOMAIN_EVENT_TYPES.ServiceRequestSubmitted,
      aggregateType: 'service-request',
      aggregateId: serviceRequestId,
      payload: buildServiceRequestSubmittedPayloadV1({
        serviceRequestId,
        unitId: 'unit-events-b',
        clientId: null,
        submittedAt: '2026-08-29T12:05:00.000Z',
      }),
      idempotencyKey: `service-request:${serviceRequestId}:submitted`,
    };

    const first = await repository.recordDomainEvent(input);
    const second = await repository.recordDomainEvent(input);

    expect(first.outcome).toBe('created');
    expect(second.outcome).toBe('duplicate');
    expect(second.domainEventId).toBe(first.domainEventId);

    const count = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM evt.domain_events WHERE idempotency_key = $1`,
      [input.idempotencyKey],
    );
    expect(count.rows[0]?.count).toBe('1');
  });

  it('rolls back domain events when the surrounding transaction fails', async () => {
    const serviceRequestId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const client: PoolClient = await pool.connect();
    try {
      await client.query('BEGIN');
      await repository.recordDomainEvent(
        {
          eventType: DOMAIN_EVENT_TYPES.BillingReady,
          aggregateType: 'billing-record',
          aggregateId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
          payload: {
            schemaVersion: 1,
            billingRecordId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
            serviceOrderId: serviceRequestId,
            measurementId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
            unitId: 'unit-events-c',
            totalAmount: '1000.0000',
            preparedAt: '2026-08-29T12:10:00.000Z',
          },
          idempotencyKey: `billing-record:dddddddd-dddd-4ddd-8ddd-dddddddddddd:ready`,
        },
        client,
      );
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }

    const count = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM evt.domain_events`,
    );
    expect(count.rows[0]?.count).toBe('0');
  });

  it('keeps event semantics independent from authorization context', async () => {
    const serviceRequestId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
    await recorder.recordServiceRequestSubmitted({
      serviceRequestId,
      unitId: 'unit-events-d',
      clientId: '11111111-1111-4111-8111-111111111111',
      submittedAt: '2026-08-29T12:15:00.000Z',
    });

    const stored = await repository.findByIdempotencyKey(`service-request:${serviceRequestId}:submitted`);
    expect(stored).toBeTruthy();
    const payload = stored!.payload;
    expect(payload).not.toHaveProperty('actorIdentityId');
    expect(payload).not.toHaveProperty('sessionId');
    expect(payload).not.toHaveProperty('grants');
  });

  it('records payment overdue without external channel coupling', async () => {
    const billingDocumentId = '99999999-9999-4999-8999-999999999999';
    await recorder.recordPaymentOverdue({
      billingDocumentId,
      billingRecordId: '88888888-8888-4888-8888-888888888888',
      serviceOrderId: '77777777-7777-4777-8777-777777777777',
      unitId: 'unit-events-e',
      documentNumber: 'NF-2026-000001',
      dueDate: '2026-08-01',
      overdueDetectedAt: '2026-08-29T12:20:00.000Z',
    });

    const stored = await repository.findByIdempotencyKey(
      `billing-document:${billingDocumentId}:payment-overdue`,
    );
    expect(stored?.event_type).toBe(DOMAIN_EVENT_TYPES.PaymentOverdue);
    const intents = await repository.listNotificationIntents(stored!.id);
    expect(intents[0]?.template_key).toBe('billing.payment.overdue');
    expect(JSON.stringify(intents[0]?.payload)).not.toMatch(/smtp|whatsapp|push/i);
  });
});
