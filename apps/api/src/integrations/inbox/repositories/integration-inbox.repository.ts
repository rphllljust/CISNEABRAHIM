import { Injectable } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../../infrastructure/database/database.service';
import {
  INTEGRATION_INBOX_DEFAULT_MAX_ATTEMPTS,
  INTEGRATION_INBOX_STATUSES,
} from '../domain/inbox-status';
import type {
  IntegrationInboxRow,
  ReceiveIntegrationMessageInput,
  ReceiveIntegrationMessageResult,
} from '../domain/inbox-message.types';
import type { IntegrationInboxErrorClass } from '../domain/inbox-status';

@Injectable()
export class IntegrationInboxRepository {
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

  async receive(
    input: ReceiveIntegrationMessageInput & { payloadHash: string },
    client?: PoolClient,
  ): Promise<ReceiveIntegrationMessageResult> {
    const db = this.pool(client);
    const inserted = await db.query<Pick<IntegrationInboxRow, 'id'>>(
      `INSERT INTO int.integration_inbox (
         provider,
         external_message_id,
         event_type,
         received_at,
         payload_hash,
         payload,
         status,
         max_attempts
       )
       VALUES ($1, $2, $3, COALESCE($4::timestamptz, NOW()), $5, $6::jsonb, $7, $8)
       ON CONFLICT (provider, external_message_id) DO NOTHING
       RETURNING id`,
      [
        input.provider,
        input.externalMessageId,
        input.eventType,
        input.receivedAt ?? null,
        input.payloadHash,
        JSON.stringify(input.payload),
        INTEGRATION_INBOX_STATUSES.Received,
        input.maxAttempts ?? INTEGRATION_INBOX_DEFAULT_MAX_ATTEMPTS,
      ],
    );
    if (inserted.rows[0]?.id) {
      return { outcome: 'created', inboxId: inserted.rows[0].id };
    }
    const existing = await this.findByProviderAndMessageId(
      input.provider,
      input.externalMessageId,
      client,
    );
    if (!existing) {
      throw new Error('INTEGRATION_INBOX_RECEIVE_FAILED');
    }
    return { outcome: 'duplicate', inboxId: existing.id };
  }

  async findById(inboxId: string, client?: PoolClient): Promise<IntegrationInboxRow | null> {
    const result = await this.pool(client).query<IntegrationInboxRow>(
      `SELECT * FROM int.integration_inbox WHERE id = $1::uuid`,
      [inboxId],
    );
    return result.rows[0] ?? null;
  }

  async findByProviderAndMessageId(
    provider: string,
    externalMessageId: string,
    client?: PoolClient,
  ): Promise<IntegrationInboxRow | null> {
    const result = await this.pool(client).query<IntegrationInboxRow>(
      `SELECT * FROM int.integration_inbox
       WHERE provider = $1 AND external_message_id = $2`,
      [provider, externalMessageId],
    );
    return result.rows[0] ?? null;
  }

  async releaseExpiredLeases(client?: PoolClient): Promise<number> {
    const result = await this.pool(client).query(
      `UPDATE int.integration_inbox
       SET status = $1,
           lease_owner = NULL,
           lease_expires_at = NULL,
           updated_at = NOW()
       WHERE status = $2
         AND lease_expires_at IS NOT NULL
         AND lease_expires_at < NOW()`,
      [INTEGRATION_INBOX_STATUSES.Received, INTEGRATION_INBOX_STATUSES.Processing],
    );
    return result.rowCount ?? 0;
  }

  async claimPending(
    workerId: string,
    limit: number,
    leaseDurationMs: number,
    client?: PoolClient,
  ): Promise<IntegrationInboxRow[]> {
    const db = this.pool(client);
    await this.releaseExpiredLeases(client);

    const result = await db.query<IntegrationInboxRow>(
      `WITH candidates AS (
         SELECT id
         FROM int.integration_inbox
         WHERE status = $1
           AND run_after <= NOW()
         ORDER BY received_at ASC
         FOR UPDATE SKIP LOCKED
         LIMIT $2
       )
       UPDATE int.integration_inbox AS inbox
       SET status = $3,
           lease_owner = $4,
           lease_expires_at = NOW() + ($5::int * interval '1 millisecond'),
           attempts = inbox.attempts + 1,
           updated_at = NOW()
       FROM candidates
       WHERE inbox.id = candidates.id
       RETURNING inbox.*`,
      [
        INTEGRATION_INBOX_STATUSES.Received,
        limit,
        INTEGRATION_INBOX_STATUSES.Processing,
        workerId,
        leaseDurationMs,
      ],
    );
    return result.rows;
  }

  async markProcessed(inboxId: string, client?: PoolClient): Promise<void> {
    await this.pool(client).query(
      `UPDATE int.integration_inbox
       SET status = $1,
           processed_at = NOW(),
           error_classification = NULL,
           last_error = NULL,
           lease_owner = NULL,
           lease_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $2::uuid`,
      [INTEGRATION_INBOX_STATUSES.Processed, inboxId],
    );
  }

  async markInvalid(
    inboxId: string,
    errorClass: IntegrationInboxErrorClass,
    errorMessage: string,
    client?: PoolClient,
  ): Promise<void> {
    await this.pool(client).query(
      `UPDATE int.integration_inbox
       SET status = $1,
           error_classification = $2,
           last_error = $3,
           lease_owner = NULL,
           lease_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $4::uuid`,
      [INTEGRATION_INBOX_STATUSES.Invalid, errorClass, errorMessage, inboxId],
    );
  }

  async markFailed(
    inboxId: string,
    errorClass: IntegrationInboxErrorClass,
    errorMessage: string,
    client?: PoolClient,
  ): Promise<void> {
    await this.pool(client).query(
      `UPDATE int.integration_inbox
       SET status = $1,
           error_classification = $2,
           last_error = $3,
           lease_owner = NULL,
           lease_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $4::uuid`,
      [INTEGRATION_INBOX_STATUSES.Failed, errorClass, errorMessage, inboxId],
    );
  }

  async scheduleRetry(
    inboxId: string,
    errorClass: IntegrationInboxErrorClass,
    errorMessage: string,
    runAfterIso: string,
    client?: PoolClient,
  ): Promise<void> {
    await this.pool(client).query(
      `UPDATE int.integration_inbox
       SET status = $1,
           error_classification = $2,
           last_error = $3,
           run_after = $4::timestamptz,
           lease_owner = NULL,
           lease_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $5::uuid`,
      [
        INTEGRATION_INBOX_STATUSES.Received,
        errorClass,
        errorMessage,
        runAfterIso,
        inboxId,
      ],
    );
  }

  async recordEffect(
    inboxId: string,
    effectKey: string,
    client?: PoolClient,
  ): Promise<'created' | 'duplicate'> {
    const inserted = await this.pool(client).query(
      `INSERT INTO int.integration_inbox_effects (inbox_id, effect_key)
       VALUES ($1::uuid, $2)
       ON CONFLICT (effect_key) DO NOTHING
       RETURNING id`,
      [inboxId, effectKey],
    );
    return inserted.rowCount && inserted.rowCount > 0 ? 'created' : 'duplicate';
  }

  async countEffects(client?: PoolClient): Promise<number> {
    const result = await this.pool(client).query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM int.integration_inbox_effects`,
    );
    return Number.parseInt(result.rows[0]?.count ?? '0', 10);
  }
}
