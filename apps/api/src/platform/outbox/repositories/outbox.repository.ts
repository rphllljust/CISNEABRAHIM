import { Injectable } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../infrastructure/database/database.service';
import { DOMAIN_EVENT_PAYLOAD_VERSION } from '../../../events/domain/domain-event-type';
import {
  OUTBOX_DEFAULT_MAX_ATTEMPTS,
  OUTBOX_EVENT_STATUSES,
} from '../domain/outbox-status';
import type { AppendOutboxEventInput, OutboxEventRow } from '../domain/outbox-event.types';

@Injectable()
export class OutboxRepository {
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

  buildOrderingKey(aggregateType: string, aggregateId: string): string {
    return `${aggregateType}:${aggregateId}`;
  }

  async append(input: AppendOutboxEventInput, client: PoolClient): Promise<string> {
    const inserted = await client.query<Pick<OutboxEventRow, 'id'>>(
      `INSERT INTO evt.outbox_events (
         event_type,
         aggregate_type,
         aggregate_id,
         payload,
         payload_version,
         occurred_at,
         available_at,
         idempotency_key,
         ordering_key,
         status,
         max_attempts
       )
       VALUES ($1, $2, $3::uuid, $4::jsonb, $5, $6::timestamptz, COALESCE($7::timestamptz, NOW()), $8, $9, $10, $11)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING id`,
      [
        input.eventType,
        input.aggregateType,
        input.aggregateId,
        JSON.stringify(input.payload),
        DOMAIN_EVENT_PAYLOAD_VERSION,
        input.occurredAt,
        input.availableAt ?? null,
        input.idempotencyKey,
        this.buildOrderingKey(input.aggregateType, input.aggregateId),
        OUTBOX_EVENT_STATUSES.Pending,
        OUTBOX_DEFAULT_MAX_ATTEMPTS,
      ],
    );
    if (inserted.rows[0]?.id) {
      return inserted.rows[0].id;
    }
    const existing = await client.query<Pick<OutboxEventRow, 'id'>>(
      `SELECT id FROM evt.outbox_events WHERE idempotency_key = $1`,
      [input.idempotencyKey],
    );
    if (!existing.rows[0]?.id) {
      throw new Error('OUTBOX_APPEND_FAILED');
    }
    return existing.rows[0].id;
  }

  async releaseExpiredLeases(client?: PoolClient): Promise<number> {
    const result = await this.pool(client).query(
      `UPDATE evt.outbox_events
       SET status = $1,
           lease_owner = NULL,
           lease_expires_at = NULL,
           updated_at = NOW()
       WHERE status = $2
         AND lease_expires_at IS NOT NULL
         AND lease_expires_at < NOW()`,
      [OUTBOX_EVENT_STATUSES.Pending, OUTBOX_EVENT_STATUSES.Processing],
    );
    return result.rowCount ?? 0;
  }

  async claimPending(
    workerId: string,
    limit: number,
    leaseDurationMs: number,
    client?: PoolClient,
  ): Promise<OutboxEventRow[]> {
    const db = this.pool(client);
    await this.releaseExpiredLeases(client);

    const result = await db.query<OutboxEventRow>(
      `WITH candidates AS (
         SELECT id
         FROM evt.outbox_events
         WHERE status = $1
           AND available_at <= NOW()
         ORDER BY ordering_key ASC, available_at ASC, sequence_number ASC
         FOR UPDATE SKIP LOCKED
         LIMIT $2
       )
       UPDATE evt.outbox_events AS events
       SET status = $3,
           lease_owner = $4,
           lease_expires_at = NOW() + ($5::int * interval '1 millisecond'),
           attempts = events.attempts + 1,
           updated_at = NOW()
       FROM candidates
       WHERE events.id = candidates.id
       RETURNING events.*`,
      [
        OUTBOX_EVENT_STATUSES.Pending,
        limit,
        OUTBOX_EVENT_STATUSES.Processing,
        workerId,
        leaseDurationMs,
      ],
    );
    return result.rows;
  }

  async markPublished(outboxEventId: string, client?: PoolClient): Promise<void> {
    await this.pool(client).query(
      `UPDATE evt.outbox_events
       SET status = $1,
           published_at = NOW(),
           lease_owner = NULL,
           lease_expires_at = NULL,
           last_error = NULL,
           updated_at = NOW()
       WHERE id = $2::uuid`,
      [OUTBOX_EVENT_STATUSES.Published, outboxEventId],
    );
  }

  async markFailed(outboxEventId: string, errorMessage: string, client?: PoolClient): Promise<void> {
    await this.pool(client).query(
      `UPDATE evt.outbox_events
       SET status = $1,
           last_error = $2,
           lease_owner = NULL,
           lease_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $3::uuid`,
      [OUTBOX_EVENT_STATUSES.Failed, errorMessage, outboxEventId],
    );
  }

  async scheduleRetry(
    outboxEventId: string,
    errorMessage: string,
    availableAtIso: string,
    client?: PoolClient,
  ): Promise<void> {
    await this.pool(client).query(
      `UPDATE evt.outbox_events
       SET status = $1,
           available_at = $2::timestamptz,
           last_error = $3,
           lease_owner = NULL,
           lease_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $4::uuid`,
      [OUTBOX_EVENT_STATUSES.Pending, availableAtIso, errorMessage, outboxEventId],
    );
  }

  async findByIdempotencyKey(idempotencyKey: string, client?: PoolClient): Promise<OutboxEventRow | null> {
    const result = await this.pool(client).query<OutboxEventRow>(
      `SELECT * FROM evt.outbox_events WHERE idempotency_key = $1`,
      [idempotencyKey],
    );
    return result.rows[0] ?? null;
  }

  async listPublishedSequenceNumbers(
    orderingKey: string,
    client?: PoolClient,
  ): Promise<number[]> {
    const result = await this.pool(client).query<{ sequence_number: string }>(
      `SELECT sequence_number::text
       FROM evt.outbox_events
       WHERE ordering_key = $1 AND status = $2
       ORDER BY sequence_number ASC`,
      [orderingKey, OUTBOX_EVENT_STATUSES.Published],
    );
    return result.rows.map((row) => Number.parseInt(row.sequence_number, 10));
  }
}
