import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { DOMAIN_EVENT_TYPES } from '../events/domain/domain-event-type';
import { buildServiceRequestSubmittedPayloadV1 } from '../events/domain/event-payloads.v1';
import { EventsModule } from '../events/events.module';
import { DomainEventsRepository } from '../events/repositories/domain-events.repository';
import { TransientJobError } from '../platform/background-jobs/domain/job-errors';
import { NOTIFICATION_CHANNELS } from './domain/notification-channel';
import { NotificationsModule } from './notifications.module';
import {
  NotificationsRepository,
  type DeliveryAttemptRow,
  type NotificationRow,
} from './repositories/notifications.repository';
import { NotificationChannelRegistry } from './services/notification-channel.registry';
import { NotificationDeliveryService } from './services/notification-delivery.service';
import { NotificationWebhookService } from './services/notification-webhook.service';
import { ControllableNotificationChannelProvider } from './testing/controllable-channel.provider';

describe('Notification delivery PostgreSQL integration', () => {
  let pool: Pool;
  let domainEventsRepository: DomainEventsRepository;
  let notificationsRepository: NotificationsRepository;
  let deliveryService: NotificationDeliveryService;
  let webhookService: NotificationWebhookService;
  let channelRegistry: NotificationChannelRegistry;
  let inAppProvider: ControllableNotificationChannelProvider;
  let inAppProviderDispatch: ControllableNotificationChannelProvider['dispatch'];
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for notification delivery integration tests.');
    }

    process.env['DATABASE_URL'] = testDatabaseUrl;
    delete process.env['EMAIL_NOTIFICATION_CONFIGURED'];
    delete process.env['EMAIL_PROVIDER_ID'];
    delete process.env['WHATSAPP_NOTIFICATION_CONFIGURED'];
    delete process.env['WHATSAPP_PROVIDER_ID'];

    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, EventsModule, NotificationsModule],
    }).compile();

    domainEventsRepository = module.get(DomainEventsRepository);
    notificationsRepository = module.get(NotificationsRepository);
    deliveryService = module.get(NotificationDeliveryService);
    webhookService = module.get(NotificationWebhookService);
    channelRegistry = module.get(NotificationChannelRegistry);

    inAppProvider = new ControllableNotificationChannelProvider(NOTIFICATION_CHANNELS.InApp, 'in-app-test');
    inAppProviderDispatch = inAppProvider.dispatch.bind(inAppProvider);
    channelRegistry.register(inAppProvider);

    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  beforeEach(async () => {
    await pool.query(
      'TRUNCATE TABLE ntf.delivery_attempts, ntf.notifications, evt.notification_intents, evt.domain_events RESTART IDENTITY CASCADE',
    );
    inAppProvider.behavior = 'success';
    inAppProvider.dispatchCount = 0;
    inAppProvider.dispatch = inAppProviderDispatch;
    channelRegistry.register(inAppProvider);
    delete process.env['EMAIL_NOTIFICATION_CONFIGURED'];
    delete process.env['EMAIL_PROVIDER_ID'];
  });

  afterAll(async () => {
    await pool.end();
  });

  async function seedPendingIntent(): Promise<string> {
    const serviceRequestId = crypto.randomUUID();
    const result = await domainEventsRepository.recordDomainEvent({
      eventType: DOMAIN_EVENT_TYPES.ServiceRequestSubmitted,
      aggregateType: 'service-request',
      aggregateId: serviceRequestId,
      payload: buildServiceRequestSubmittedPayloadV1({
        serviceRequestId,
        unitId: 'unit-notification',
        clientId: null,
        submittedAt: '2026-08-29T12:00:00.000Z',
      }),
      idempotencyKey: `service-request:${serviceRequestId}:submitted`,
    });
    return result.notificationIntentIds[0] as string;
  }

  it('delivers IN_APP notification successfully with delivery attempt audit', async () => {
    const intentId = await seedPendingIntent();

    const result = await deliveryService.dispatchNotificationIntent(intentId);

    expect(result.channelsAttempted).toEqual([NOTIFICATION_CHANNELS.InApp]);
    expect(inAppProvider.dispatchCount).toBe(1);

    const intent = await notificationsRepository.findIntentById(intentId);
    expect(intent?.status).toBe('DISPATCHED');

    const notifications = await pool.query<NotificationRow>(
      `SELECT * FROM ntf.notifications WHERE notification_intent_id = $1::uuid`,
      [intentId],
    );
    expect(notifications.rows).toHaveLength(1);
    expect(notifications.rows[0]?.status).toBe('DELIVERED');

    const attempts = await pool.query<DeliveryAttemptRow>(
      `SELECT * FROM ntf.delivery_attempts WHERE notification_id = $1::uuid`,
      [notifications.rows[0]?.id],
    );
    expect(attempts.rows).toHaveLength(1);
    const firstAttempt = attempts.rows[0];
    expect(firstAttempt?.channel).toBe(NOTIFICATION_CHANNELS.InApp);
    expect(firstAttempt?.attempt).toBe(1);
    expect(firstAttempt?.status).toBe('DELIVERED');
    expect(firstAttempt?.provider).toBe('in-app-test');
    expect(typeof firstAttempt?.provider_message_id).toBe('string');
    expect(firstAttempt?.sent_at).toBeTruthy();
    expect(firstAttempt?.delivered_at).toBeTruthy();
    expect(firstAttempt?.failure_code).toBeNull();
  });

  it('retries after transient failure and succeeds on second attempt', async () => {
    const intentId = await seedPendingIntent();
    inAppProvider.behavior = 'transient';

    await expect(deliveryService.dispatchNotificationIntent(intentId)).rejects.toBeInstanceOf(
      TransientJobError,
    );

    inAppProvider.behavior = 'success';
    await deliveryService.dispatchNotificationIntent(intentId);

    const notifications = await pool.query<{ id: string }>(
      `SELECT id FROM ntf.notifications WHERE notification_intent_id = $1::uuid`,
      [intentId],
    );
    const notificationId = notifications.rows[0]?.id;
    if (!notificationId) {
      throw new Error('NOTIFICATION_NOT_FOUND');
    }
    const attempts = await notificationsRepository.listAttemptsForNotification(
      notificationId,
    );
    expect(attempts).toHaveLength(2);
    expect(attempts[0]?.status).toBe('FAILED');
    expect(attempts[1]?.status).toBe('DELIVERED');
    expect(inAppProvider.dispatchCount).toBe(2);
  });

  it('records permanent failure without blocking other channels when IN_APP succeeds', async () => {
    const intentId = await seedPendingIntent();
    process.env['EMAIL_NOTIFICATION_CONFIGURED'] = 'true';
    process.env['EMAIL_PROVIDER_ID'] = 'test-email';

    const emailProvider = new ControllableNotificationChannelProvider(
      NOTIFICATION_CHANNELS.Email,
      'email-test',
    );
    emailProvider.behavior = 'permanent';
    channelRegistry.register(emailProvider);

    await deliveryService.dispatchNotificationIntent(intentId);

    const notifications = await pool.query(
      `SELECT channel, status FROM ntf.notifications WHERE notification_intent_id = $1::uuid ORDER BY channel`,
      [intentId],
    );
    expect(notifications.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ channel: NOTIFICATION_CHANNELS.Email, status: 'FAILED' }),
        expect.objectContaining({ channel: NOTIFICATION_CHANNELS.InApp, status: 'DELIVERED' }),
      ]),
    );

    delete process.env['EMAIL_NOTIFICATION_CONFIGURED'];
    delete process.env['EMAIL_PROVIDER_ID'];
  });

  it('skips duplicate dispatch when provider already accepted the message', async () => {
    const intentId = await seedPendingIntent();

    await deliveryService.dispatchNotificationIntent(intentId);
    const firstCount = inAppProvider.dispatchCount;

    await pool.query(`UPDATE evt.notification_intents SET status = 'PENDING' WHERE id = $1::uuid`, [
      intentId,
    ]);

    await deliveryService.dispatchNotificationIntent(intentId);
    expect(inAppProvider.dispatchCount).toBe(firstCount);
  });

  it('applies webhook delivery update by provider message id', async () => {
    const intentId = await seedPendingIntent();
    inAppProvider.fixedProviderMessageId = 'provider-msg-webhook-in-app';
    inAppProvider.dispatch = async () => {
      const sentAt = new Date().toISOString();
      return {
        providerMessageId: inAppProvider.fixedProviderMessageId as string,
        sentAt,
      };
    };

    await deliveryService.dispatchNotificationIntent(intentId);

    const notification = (
      await pool.query<{ id: string }>(
        `SELECT id FROM ntf.notifications WHERE notification_intent_id = $1::uuid AND channel = 'IN_APP'`,
        [intentId],
      )
    ).rows[0];

    const attemptBefore = (
      await pool.query<{ provider_message_id: string; status: string; delivered_at: string | null }>(
        `SELECT provider_message_id, status, delivered_at
         FROM ntf.delivery_attempts
         WHERE notification_id = $1::uuid`,
        [notification?.id],
      )
    ).rows[0];

    expect(attemptBefore?.status).toBe('SENT');
    expect(attemptBefore?.delivered_at).toBeNull();

    const deliveredAt = '2026-08-29T15:30:00.000Z';
    const updated = await webhookService.applyDeliveryUpdate({
      providerMessageId: attemptBefore?.provider_message_id as string,
      deliveredAt,
    });

    expect(updated?.status).toBe('DELIVERED');
    expect(new Date(updated?.delivered_at as string).toISOString()).toBe(deliveredAt);
  });

  it('handles provider timeout as transient failure', async () => {
    const intentId = await seedPendingIntent();
    inAppProvider.behavior = 'timeout';

    await expect(deliveryService.dispatchNotificationIntent(intentId)).rejects.toBeInstanceOf(
      TransientJobError,
    );

    const notifications = await pool.query<{ id: string }>(
      `SELECT id FROM ntf.notifications WHERE notification_intent_id = $1::uuid`,
      [intentId],
    );
    const notificationId = notifications.rows[0]?.id;
    if (!notificationId) {
      throw new Error('NOTIFICATION_NOT_FOUND');
    }
    const attempts = await notificationsRepository.listAttemptsForNotification(
      notificationId,
    );
    expect(attempts[0]?.failure_code).toBe('SIMULATED_TIMEOUT');
  });

  it('fails with permanent error for invalid email recipient', async () => {
    const billingRecordId = crypto.randomUUID();
    const recorded = await domainEventsRepository.recordDomainEvent({
      eventType: DOMAIN_EVENT_TYPES.BillingReady,
      aggregateType: 'billing-record',
      aggregateId: billingRecordId,
      payload: { schemaVersion: 1 },
      idempotencyKey: `billing:${billingRecordId}:ready`,
    });
    const intentId = recorded.notificationIntentIds[0] as string;

    process.env['EMAIL_NOTIFICATION_CONFIGURED'] = 'true';
    process.env['EMAIL_PROVIDER_ID'] = 'test-email';
    const emailProvider = new ControllableNotificationChannelProvider(
      NOTIFICATION_CHANNELS.Email,
      'email-invalid',
    );
    channelRegistry.register(emailProvider);

    await deliveryService.dispatchNotificationIntent(intentId);

    const emailAttempt = (
      await pool.query<{ failure_code: string | null; status: string }>(
        `SELECT da.failure_code, da.status
         FROM ntf.delivery_attempts da
         JOIN ntf.notifications n ON n.id = da.notification_id
         WHERE n.notification_intent_id = $1::uuid AND da.channel = 'EMAIL'`,
        [intentId],
      )
    ).rows[0];

    expect(emailAttempt?.failure_code).toBe('INVALID_RECIPIENT');
    expect(emailAttempt?.status).toBe('FAILED');

    delete process.env['EMAIL_NOTIFICATION_CONFIGURED'];
    delete process.env['EMAIL_PROVIDER_ID'];
  });
});
