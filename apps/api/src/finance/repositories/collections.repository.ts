import { Injectable } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../infrastructure/database/database.service';
import {
  COLLECTION_ACTION_KINDS,
  COLLECTION_HISTORY_EVENTS,
  CollectionError,
  assertCollectionOpen,
  shouldCloseCollection,
} from '../domain/collection';
import type {
  CollectionActionRow,
  CollectionCaseRow,
  CollectionHistoryRow,
  CollectionPromiseRow,
  OpenCollectionPersistenceInput,
  RecordActionPersistenceInput,
  RecordPromisePersistenceInput,
  RenegotiatePersistenceInput,
} from './collections.repository.types';

const CASE_RETURNING = `
  id, receivable_id, unit_id, client_id, status::text AS status, opened_because_overdue,
  promised_due_date::text AS promised_due_date, version, opened_at, closed_at,
  opened_by_identity_id, closed_by_identity_id
`;

const ACTION_RETURNING = `
  id, collection_id, kind::text AS kind, notes, actor_identity_id, occurred_at, idempotency_key
`;

const PROMISE_RETURNING = `
  id, collection_id, action_id, promised_amount::text AS promised_amount, promised_on::text AS promised_on,
  status::text AS status, created_at, resolved_at
`;

const HISTORY_RETURNING = `
  id, collection_id, event_kind, payload, actor_identity_id, occurred_at
`;

export type CollectionAggregate = {
  collection: CollectionCaseRow;
  actions: CollectionActionRow[];
  promises: CollectionPromiseRow[];
  history: CollectionHistoryRow[];
};

@Injectable()
export class CollectionsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private pool(): Pool {
    const connection = this.databaseService.getConnection();
    if (!connection) {
      throw new Error('DATABASE_URL is not configured.');
    }
    return connection.pool;
  }

  async findById(collectionId: string): Promise<CollectionAggregate | null> {
    return this.loadAggregate(collectionId);
  }

  async findOpenByReceivableId(receivableId: string): Promise<CollectionAggregate | null> {
    const result = await this.pool().query<CollectionCaseRow>(
      `SELECT ${CASE_RETURNING} FROM fin.receivable_collections WHERE receivable_id = $1 AND status = 'OPEN'`,
      [receivableId],
    );
    if (!result.rows[0]) {
      return null;
    }
    return this.loadAggregate(result.rows[0].id);
  }

  async openCase(input: OpenCollectionPersistenceInput): Promise<CollectionAggregate> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');
      const existing = await client.query<CollectionCaseRow>(
        `SELECT ${CASE_RETURNING}
         FROM fin.receivable_collections
         WHERE receivable_id = $1 AND status = 'OPEN'
         FOR UPDATE`,
        [input.receivableId],
      );
      if (existing.rows[0]) {
        await client.query('COMMIT');
        return (await this.loadAggregate(existing.rows[0].id))!;
      }
      const inserted = await client.query<CollectionCaseRow>(
        `INSERT INTO fin.receivable_collections (
           receivable_id, unit_id, client_id, opened_because_overdue, opened_by_identity_id
         )
         VALUES ($1, $2, $3, true, $4)
         RETURNING ${CASE_RETURNING}`,
        [input.receivableId, input.unitId, input.clientId, input.actorIdentityId],
      );
      await this.appendHistory(client, {
        collectionId: inserted.rows[0]!.id,
        eventKind: COLLECTION_HISTORY_EVENTS.CaseOpened,
        payload: { receivableId: input.receivableId, overdue: true },
        actorIdentityId: input.actorIdentityId,
      });
      await client.query('COMMIT');
      return (await this.loadAggregate(inserted.rows[0]!.id))!;
    } catch (error) {
      await client.query('ROLLBACK');
      if (isUniqueViolation(error)) {
        const raced = await this.findOpenByReceivableId(input.receivableId);
        if (raced) {
          return raced;
        }
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async recordAction(input: RecordActionPersistenceInput): Promise<CollectionAggregate> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');
      const locked = await this.lockOpenCase(client, input.collectionId);
      const replay = await this.findActionByKey(client, input.collectionId, input.idempotencyKey);
      if (replay) {
        await client.query('COMMIT');
        return (await this.loadAggregate(input.collectionId))!;
      }
      await client.query(
        `INSERT INTO fin.collection_actions (collection_id, kind, notes, actor_identity_id, idempotency_key)
         VALUES ($1, $2::fin.collection_action_kind, $3, $4, $5)`,
        [locked.id, input.kind, input.notes, input.actorIdentityId, input.idempotencyKey],
      );
      await this.appendHistory(client, {
        collectionId: locked.id,
        eventKind: COLLECTION_HISTORY_EVENTS.ActionRecorded,
        payload: { kind: input.kind, notes: input.notes },
        actorIdentityId: input.actorIdentityId,
      });
      await client.query('COMMIT');
      return (await this.loadAggregate(locked.id))!;
    } catch (error) {
      await client.query('ROLLBACK');
      if (isUniqueViolation(error)) {
        return (await this.loadAggregate(input.collectionId))!;
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async recordPromise(input: RecordPromisePersistenceInput): Promise<CollectionAggregate> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');
      const locked = await this.lockOpenCase(client, input.collectionId);
      const replay = await this.findActionByKey(client, input.collectionId, input.idempotencyKey);
      if (replay) {
        await client.query('COMMIT');
        return (await this.loadAggregate(input.collectionId))!;
      }
      const action = await client.query<CollectionActionRow>(
        `INSERT INTO fin.collection_actions (collection_id, kind, notes, actor_identity_id, idempotency_key)
         VALUES ($1, $2::fin.collection_action_kind, $3, $4, $5)
         RETURNING ${ACTION_RETURNING}`,
        [
          locked.id,
          COLLECTION_ACTION_KINDS.PromiseToPay,
          input.notes,
          input.actorIdentityId,
          input.idempotencyKey,
        ],
      );
      await client.query(
        `INSERT INTO fin.collection_promises (collection_id, action_id, promised_amount, promised_on)
         VALUES ($1, $2, $3, $4::date)`,
        [locked.id, action.rows[0]!.id, input.promisedAmount, input.promisedOn],
      );
      await this.appendHistory(client, {
        collectionId: locked.id,
        eventKind: COLLECTION_HISTORY_EVENTS.PromiseRecorded,
        payload: { promisedAmount: input.promisedAmount, promisedOn: input.promisedOn },
        actorIdentityId: input.actorIdentityId,
      });
      await client.query('COMMIT');
      return (await this.loadAggregate(locked.id))!;
    } catch (error) {
      await client.query('ROLLBACK');
      if (isUniqueViolation(error)) {
        return (await this.loadAggregate(input.collectionId))!;
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async renegotiate(input: RenegotiatePersistenceInput): Promise<CollectionAggregate | 'VERSION_CONFLICT'> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');
      const locked = await this.lockOpenCase(client, input.collectionId);
      if (locked.version !== input.expectedVersion) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }
      const replay = await this.findActionByKey(client, input.collectionId, input.idempotencyKey);
      if (replay) {
        await client.query('COMMIT');
        return (await this.loadAggregate(input.collectionId))!;
      }
      const action = await client.query<CollectionActionRow>(
        `INSERT INTO fin.collection_actions (collection_id, kind, notes, actor_identity_id, idempotency_key)
         VALUES ($1, $2::fin.collection_action_kind, $3, $4, $5)
         RETURNING ${ACTION_RETURNING}`,
        [
          locked.id,
          COLLECTION_ACTION_KINDS.Renegotiation,
          input.notes,
          input.actorIdentityId,
          input.idempotencyKey,
        ],
      );
      if (input.promisedAmount && input.promisedOn) {
        await client.query(
          `INSERT INTO fin.collection_promises (collection_id, action_id, promised_amount, promised_on)
           VALUES ($1, $2, $3, $4::date)`,
          [locked.id, action.rows[0]!.id, input.promisedAmount, input.promisedOn],
        );
      }
      const updated = await client.query<CollectionCaseRow>(
        `UPDATE fin.receivable_collections
         SET promised_due_date = $2::date, version = version + 1, updated_at = NOW()
         WHERE id = $1 AND version = $3
         RETURNING ${CASE_RETURNING}`,
        [locked.id, input.promisedDueDate, input.expectedVersion],
      );
      if (!updated.rows[0]) {
        await client.query('ROLLBACK');
        return 'VERSION_CONFLICT';
      }
      await this.appendHistory(client, {
        collectionId: locked.id,
        eventKind: COLLECTION_HISTORY_EVENTS.Renegotiated,
        payload: {
          promisedDueDate: input.promisedDueDate,
          promisedAmount: input.promisedAmount,
        },
        actorIdentityId: input.actorIdentityId,
      });
      await client.query('COMMIT');
      return (await this.loadAggregate(locked.id))!;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async applySettlementOutcome(
    client: PoolClient,
    input: {
      receivableId: string;
      remaining: string;
      settlementId: string;
      actorIdentityId: string;
    },
  ): Promise<void> {
    const locked = await client.query<CollectionCaseRow>(
      `SELECT ${CASE_RETURNING}
       FROM fin.receivable_collections
       WHERE receivable_id = $1 AND status = 'OPEN'
       FOR UPDATE`,
      [input.receivableId],
    );
    const collection = locked.rows[0];
    if (!collection) {
      return;
    }
    if (shouldCloseCollection(input.remaining)) {
      await client.query(
        `UPDATE fin.receivable_collections
         SET status = 'CLOSED', closed_at = NOW(), closed_by_identity_id = $2, updated_at = NOW()
         WHERE id = $1 AND status = 'OPEN'`,
        [collection.id, input.actorIdentityId],
      );
      await client.query(
        `UPDATE fin.collection_promises
         SET status = 'KEPT', resolved_at = NOW()
         WHERE collection_id = $1 AND status = 'OPEN'`,
        [collection.id],
      );
      await this.appendHistory(client, {
        collectionId: collection.id,
        eventKind: COLLECTION_HISTORY_EVENTS.CaseClosedSettled,
        payload: { settlementId: input.settlementId, remaining: input.remaining },
        actorIdentityId: input.actorIdentityId,
      });
      return;
    }
    await this.appendHistory(client, {
      collectionId: collection.id,
      eventKind: COLLECTION_HISTORY_EVENTS.SettlementPartial,
      payload: { settlementId: input.settlementId, remaining: input.remaining },
      actorIdentityId: input.actorIdentityId,
    });
  }

  async listHistory(collectionId: string): Promise<CollectionHistoryRow[]> {
    const result = await this.pool().query<CollectionHistoryRow>(
      `SELECT ${HISTORY_RETURNING}
       FROM fin.collection_history
       WHERE collection_id = $1
       ORDER BY occurred_at, id`,
      [collectionId],
    );
    return result.rows;
  }

  private async lockOpenCase(client: PoolClient, collectionId: string): Promise<CollectionCaseRow> {
    const result = await client.query<CollectionCaseRow>(
      `SELECT ${CASE_RETURNING} FROM fin.receivable_collections WHERE id = $1 FOR UPDATE`,
      [collectionId],
    );
    const row = result.rows[0];
    if (!row) {
      throw new CollectionError('COLLECTION_NOT_FOUND');
    }
    assertCollectionOpen(row.status);
    return row;
  }

  private async findActionByKey(
    client: PoolClient,
    collectionId: string,
    idempotencyKey: string,
  ): Promise<CollectionActionRow | null> {
    const result = await client.query<CollectionActionRow>(
      `SELECT ${ACTION_RETURNING}
       FROM fin.collection_actions
       WHERE collection_id = $1 AND idempotency_key = $2`,
      [collectionId, idempotencyKey],
    );
    return result.rows[0] ?? null;
  }

  private async appendHistory(
    client: PoolClient,
    input: {
      collectionId: string;
      eventKind: string;
      payload: Record<string, unknown>;
      actorIdentityId: string;
    },
  ): Promise<void> {
    await client.query(
      `INSERT INTO fin.collection_history (collection_id, event_kind, payload, actor_identity_id)
       VALUES ($1, $2, $3::jsonb, $4)`,
      [input.collectionId, input.eventKind, JSON.stringify(input.payload), input.actorIdentityId],
    );
  }

  private async loadAggregate(collectionId: string): Promise<CollectionAggregate | null> {
    const collection = await this.pool().query<CollectionCaseRow>(
      `SELECT ${CASE_RETURNING} FROM fin.receivable_collections WHERE id = $1`,
      [collectionId],
    );
    if (!collection.rows[0]) {
      return null;
    }
    const [actions, promises, history] = await Promise.all([
      this.pool().query<CollectionActionRow>(
        `SELECT ${ACTION_RETURNING} FROM fin.collection_actions WHERE collection_id = $1 ORDER BY occurred_at`,
        [collectionId],
      ),
      this.pool().query<CollectionPromiseRow>(
        `SELECT ${PROMISE_RETURNING} FROM fin.collection_promises WHERE collection_id = $1 ORDER BY created_at`,
        [collectionId],
      ),
      this.pool().query<CollectionHistoryRow>(
        `SELECT ${HISTORY_RETURNING} FROM fin.collection_history WHERE collection_id = $1 ORDER BY occurred_at, id`,
        [collectionId],
      ),
    ]);
    return {
      collection: collection.rows[0],
      actions: actions.rows,
      promises: promises.rows,
      history: history.rows,
    };
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}
