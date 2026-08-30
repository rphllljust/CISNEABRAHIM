import { Injectable } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../infrastructure/database/database.service';
import type { NotificationChannel } from '../domain/notification-channel';
import type { DeliveryAttemptStatus, NotificationStatus } from '../domain/notification-channel';

export type NotificationRow = {
  id: string;
  notification_intent_id: string;
  channel: NotificationChannel;
  recipient_ref: string;
  template_key: string;
  status: NotificationStatus;
  created_at: string;
};

export type DeliveryAttemptRow = {
  id: string;
  notification_id: string;
  channel: NotificationChannel;
  recipient_ref: string;
  provider: string;
  attempt: number;
  status: DeliveryAttemptStatus;
  provider_message_id: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  failure_code: string | null;
  created_at: string;
};

export type NotificationIntentDispatchRow = {
  id: string;
  domain_event_id: string;
  intent_key: string;
  audience_scope: string;
  template_key: string;
  payload: Record<string, unknown>;
  status: string;
};

export type CreateNotificationInput = {
  notificationIntentId: string;
  channel: NotificationChannel;
  recipientRef: string;
  templateKey: string;
};

export type RecordDeliveryAttemptInput = {
  notificationId: string;
  channel: NotificationChannel;
  recipientRef: string;
  provider: string;
  attempt: number;
  status: DeliveryAttemptStatus;
  providerMessageId?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  failureCode?: string | null;
};

@Injectable()
export class NotificationsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private pool(client?: PoolClient): Pool | PoolClient {
    if (client) {
      return client;
    }
    const connection = this.databaseService.getConnection();
    if (!connection) {
      throw new Error('DATABASE_NOT_CONFIGURED');
    }
    return connection.pool;
  }

  async findIntentById(intentId: string, client?: PoolClient): Promise<NotificationIntentDispatchRow | null> {
    const result = await this.pool(client).query<NotificationIntentDispatchRow>(
      `SELECT id, domain_event_id, intent_key, audience_scope, template_key, payload, status
       FROM evt.notification_intents
       WHERE id = $1::uuid`,
      [intentId],
    );
    return result.rows[0] ?? null;
  }

  async markIntentDispatched(intentId: string, client?: PoolClient): Promise<boolean> {
    const result = await this.pool(client).query(
      `UPDATE evt.notification_intents
       SET status = 'DISPATCHED'
       WHERE id = $1::uuid AND status = 'PENDING'`,
      [intentId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async getOrCreateNotification(
    input: CreateNotificationInput,
    client?: PoolClient,
  ): Promise<NotificationRow> {
    const existing = await this.pool(client).query<NotificationRow>(
      `SELECT id, notification_intent_id, channel, recipient_ref, template_key, status, created_at
       FROM ntf.notifications
       WHERE notification_intent_id = $1::uuid AND channel = $2`,
      [input.notificationIntentId, input.channel],
    );
    if (existing.rows[0]) {
      return existing.rows[0];
    }

    const inserted = await this.pool(client).query<NotificationRow>(
      `INSERT INTO ntf.notifications (
         notification_intent_id,
         channel,
         recipient_ref,
         template_key,
         status
       )
       VALUES ($1::uuid, $2, $3, $4, 'PENDING')
       ON CONFLICT (notification_intent_id, channel) DO UPDATE
         SET recipient_ref = EXCLUDED.recipient_ref
       RETURNING id, notification_intent_id, channel, recipient_ref, template_key, status, created_at`,
      [input.notificationIntentId, input.channel, input.recipientRef, input.templateKey],
    );
    const row = inserted.rows[0];
    if (!row) {
      throw new Error('NOTIFICATION_INSERT_FAILED');
    }
    return row;
  }

  async findAcceptedAttempt(notificationId: string, client?: PoolClient): Promise<DeliveryAttemptRow | null> {
    const result = await this.pool(client).query<DeliveryAttemptRow>(
      `SELECT id, notification_id, channel, recipient_ref, provider, attempt, status,
              provider_message_id, sent_at, delivered_at, failure_code, created_at
       FROM ntf.delivery_attempts
       WHERE notification_id = $1::uuid
         AND status IN ('SENT', 'DELIVERED')
         AND provider_message_id IS NOT NULL
       ORDER BY attempt ASC
       LIMIT 1`,
      [notificationId],
    );
    return result.rows[0] ?? null;
  }

  async countAttempts(notificationId: string, client?: PoolClient): Promise<number> {
    const result = await this.pool(client).query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ntf.delivery_attempts WHERE notification_id = $1::uuid`,
      [notificationId],
    );
    return Number.parseInt(result.rows[0]?.count ?? '0', 10);
  }

  async recordDeliveryAttempt(
    input: RecordDeliveryAttemptInput,
    client?: PoolClient,
  ): Promise<DeliveryAttemptRow> {
    const inserted = await this.pool(client).query<DeliveryAttemptRow>(
      `INSERT INTO ntf.delivery_attempts (
         notification_id,
         channel,
         recipient_ref,
         provider,
         attempt,
         status,
         provider_message_id,
         sent_at,
         delivered_at,
         failure_code
       )
       VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8::timestamptz, $9::timestamptz, $10)
       RETURNING id, notification_id, channel, recipient_ref, provider, attempt, status,
                 provider_message_id, sent_at, delivered_at, failure_code, created_at`,
      [
        input.notificationId,
        input.channel,
        input.recipientRef,
        input.provider,
        input.attempt,
        input.status,
        input.providerMessageId ?? null,
        input.sentAt ?? null,
        input.deliveredAt ?? null,
        input.failureCode ?? null,
      ],
    );
    const row = inserted.rows[0];
    if (!row) {
      throw new Error('DELIVERY_ATTEMPT_INSERT_FAILED');
    }
    return row;
  }

  async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus,
    client?: PoolClient,
  ): Promise<void> {
    await this.pool(client).query(
      `UPDATE ntf.notifications SET status = $2 WHERE id = $1::uuid`,
      [notificationId, status],
    );
  }

  async findAttemptByProviderMessageId(
    providerMessageId: string,
    client?: PoolClient,
  ): Promise<DeliveryAttemptRow | null> {
    const result = await this.pool(client).query<DeliveryAttemptRow>(
      `SELECT id, notification_id, channel, recipient_ref, provider, attempt, status,
              provider_message_id, sent_at, delivered_at, failure_code, created_at
       FROM ntf.delivery_attempts
       WHERE provider_message_id = $1
       LIMIT 1`,
      [providerMessageId],
    );
    return result.rows[0] ?? null;
  }

  async applyDeliveryUpdate(
    providerMessageId: string,
    deliveredAt: string,
    client?: PoolClient,
  ): Promise<DeliveryAttemptRow | null> {
    const attempt = await this.findAttemptByProviderMessageId(providerMessageId, client);
    if (!attempt) {
      return null;
    }
    if (attempt.delivered_at) {
      return attempt;
    }

    const updated = await this.pool(client).query<DeliveryAttemptRow>(
      `UPDATE ntf.delivery_attempts
       SET status = 'DELIVERED', delivered_at = $2::timestamptz
       WHERE id = $1::uuid
       RETURNING id, notification_id, channel, recipient_ref, provider, attempt, status,
                 provider_message_id, sent_at, delivered_at, failure_code, created_at`,
      [attempt.id, deliveredAt],
    );
    const row = updated.rows[0];
    if (row) {
      await this.updateNotificationStatus(row.notification_id, 'DELIVERED', client);
    }
    return row ?? null;
  }

  async listAttemptsForNotification(notificationId: string, client?: PoolClient): Promise<DeliveryAttemptRow[]> {
    const result = await this.pool(client).query<DeliveryAttemptRow>(
      `SELECT id, notification_id, channel, recipient_ref, provider, attempt, status,
              provider_message_id, sent_at, delivered_at, failure_code, created_at
       FROM ntf.delivery_attempts
       WHERE notification_id = $1::uuid
       ORDER BY attempt ASC`,
      [notificationId],
    );
    return result.rows;
  }
}
