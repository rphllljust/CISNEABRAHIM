import { Injectable } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../infrastructure/database/database.service';
import type { DomainEventType } from '../domain/domain-event-type';
import {
  DOMAIN_EVENT_PAYLOAD_VERSION,
  NOTIFICATION_INTENT_PAYLOAD_VERSION,
  NOTIFICATION_INTENT_STATUS,
} from '../domain/domain-event-type';
import { resolveNotificationIntents } from '../domain/notification-intent-catalog';

export type DomainEventRow = {
  id: string;
  event_type: DomainEventType;
  aggregate_type: string;
  aggregate_id: string;
  payload_version: number;
  payload: Record<string, unknown>;
  occurred_at: string;
  idempotency_key: string | null;
  created_at: string;
};

export type NotificationIntentRow = {
  id: string;
  domain_event_id: string;
  intent_key: string;
  audience_scope: string;
  template_key: string;
  payload_version: number;
  payload: Record<string, unknown>;
  status: string;
  created_at: string;
};

export type RecordDomainEventInput = {
  eventType: DomainEventType;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  occurredAt?: string;
  idempotencyKey: string;
};

export type RecordDomainEventResult =
  | { outcome: 'created'; domainEventId: string; notificationIntentIds: string[] }
  | { outcome: 'duplicate'; domainEventId: string; notificationIntentIds: string[] };

@Injectable()
export class DomainEventsRepository {
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

  async recordDomainEvent(
    input: RecordDomainEventInput,
    client?: PoolClient,
  ): Promise<RecordDomainEventResult> {
    const db = this.pool(client);
    const existing = await db.query<Pick<DomainEventRow, 'id'>>(
      `SELECT id FROM evt.domain_events WHERE idempotency_key = $1`,
      [input.idempotencyKey],
    );
    if (existing.rows[0]?.id) {
      const intents = await this.listNotificationIntents(existing.rows[0].id, client);
      return {
        outcome: 'duplicate',
        domainEventId: existing.rows[0].id,
        notificationIntentIds: intents.map((row) => row.id),
      };
    }

    const inserted = await db.query<Pick<DomainEventRow, 'id'>>(
      `INSERT INTO evt.domain_events (
         event_type,
         aggregate_type,
         aggregate_id,
         payload_version,
         payload,
         occurred_at,
         idempotency_key
       )
       VALUES ($1, $2, $3::uuid, $4, $5::jsonb, COALESCE($6::timestamptz, NOW()), $7)
       RETURNING id`,
      [
        input.eventType,
        input.aggregateType,
        input.aggregateId,
        DOMAIN_EVENT_PAYLOAD_VERSION,
        JSON.stringify(input.payload),
        input.occurredAt ?? null,
        input.idempotencyKey,
      ],
    );
    const domainEventId = inserted.rows[0]?.id;
    if (!domainEventId) {
      throw new Error('DOMAIN_EVENT_INSERT_FAILED');
    }

    const notificationIntentIds: string[] = [];
    for (const intent of resolveNotificationIntents(input.eventType)) {
      const intentRow = await db.query<Pick<NotificationIntentRow, 'id'>>(
        `INSERT INTO evt.notification_intents (
           domain_event_id,
           intent_key,
           audience_scope,
           template_key,
           payload_version,
           payload,
           status
         )
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
         ON CONFLICT (domain_event_id, intent_key) DO NOTHING
         RETURNING id`,
        [
          domainEventId,
          intent.intentKey,
          intent.audienceScope,
          intent.templateKey,
          NOTIFICATION_INTENT_PAYLOAD_VERSION,
          JSON.stringify(intent.payload),
          NOTIFICATION_INTENT_STATUS.Pending,
        ],
      );
      if (intentRow.rows[0]?.id) {
        notificationIntentIds.push(intentRow.rows[0].id);
      }
    }

    return { outcome: 'created', domainEventId, notificationIntentIds };
  }

  async findByIdempotencyKey(idempotencyKey: string, client?: PoolClient): Promise<DomainEventRow | null> {
    const result = await this.pool(client).query<DomainEventRow>(
      `SELECT id, event_type, aggregate_type, aggregate_id, payload_version, payload, occurred_at, idempotency_key, created_at
       FROM evt.domain_events
       WHERE idempotency_key = $1`,
      [idempotencyKey],
    );
    return result.rows[0] ?? null;
  }

  async listNotificationIntents(domainEventId: string, client?: PoolClient): Promise<NotificationIntentRow[]> {
    const result = await this.pool(client).query<NotificationIntentRow>(
      `SELECT id, domain_event_id, intent_key, audience_scope, template_key, payload_version, payload, status, created_at
       FROM evt.notification_intents
       WHERE domain_event_id = $1
       ORDER BY created_at ASC`,
      [domainEventId],
    );
    return result.rows;
  }
}
