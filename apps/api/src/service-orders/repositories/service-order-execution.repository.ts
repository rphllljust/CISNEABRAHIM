import { Injectable } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { EXECUTION_ENTRY_HISTORY_EVENTS } from '../domain/service-order-execution';
import type {
  ExecutionCommandIdempotencyRow,
  ExecutionEntryRow,
  ExecutionEvidenceRow,
  ExecutionOccurrenceRow,
  ExecutionTransitionPersistenceInput,
  ExecutionTransitionResult,
  RecordEvidencePersistenceResult,
  RecordExecutionEntryInput,
  RecordExecutionEvidenceInput,
  RecordExecutionOccurrenceInput,
  RecordExecutionPersistenceResult,
  RecordOccurrencePersistenceResult,
} from './service-order-execution.repository.types';

type PlannedResourceCoverageRow = {
  requirement_kind: string;
  resource_type_code: string | null;
  labor_type_code: string | null;
  planned_quantity: string;
  status: string;
};

const ENTRY_RETURNING = `
  id, service_order_id, entry_type::text AS entry_type, evidence_kind,
  quantity_value::text AS quantity_value, quantity_unit_code, text_value, context,
  actor_identity_id, recorded_at, idempotency_key, row_version
`;

@Injectable()
export class ServiceOrderExecutionRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private pool(): Pool {
    const connection = this.databaseService.getConnection();
    if (!connection) {
      throw new Error('DATABASE_URL is not configured.');
    }
    return connection.pool;
  }

  async findIdempotency(
    serviceOrderId: string,
    commandName: string,
    idempotencyKey: string,
  ): Promise<ExecutionCommandIdempotencyRow | null> {
    const result = await this.pool().query<ExecutionCommandIdempotencyRow>(
      `SELECT id, service_order_id, command_name, idempotency_key, response_payload, created_at
       FROM so.execution_command_idempotency
       WHERE service_order_id = $1 AND command_name = $2 AND idempotency_key = $3`,
      [serviceOrderId, commandName, idempotencyKey],
    );
    return result.rows[0] ?? null;
  }

  async listEntries(serviceOrderId: string): Promise<ExecutionEntryRow[]> {
    const result = await this.pool().query<ExecutionEntryRow>(
      `SELECT ${ENTRY_RETURNING}
       FROM so.execution_entries
       WHERE service_order_id = $1
       ORDER BY recorded_at ASC, id ASC`,
      [serviceOrderId],
    );
    return result.rows;
  }

  async listEvidence(serviceOrderId: string): Promise<ExecutionEvidenceRow[]> {
    const result = await this.pool().query<ExecutionEvidenceRow>(
      `SELECT id, service_order_id, evidence_kind, payload, actor_identity_id, recorded_at, idempotency_key
       FROM so.execution_evidence
       WHERE service_order_id = $1
       ORDER BY recorded_at ASC, id ASC`,
      [serviceOrderId],
    );
    return result.rows;
  }

  async listOccurrences(serviceOrderId: string): Promise<ExecutionOccurrenceRow[]> {
    const result = await this.pool().query<ExecutionOccurrenceRow>(
      `SELECT id, service_order_id, occurrence_code, description, payload, actor_identity_id, recorded_at, idempotency_key
       FROM so.execution_occurrences
       WHERE service_order_id = $1
       ORDER BY recorded_at ASC, id ASC`,
      [serviceOrderId],
    );
    return result.rows;
  }

  async listPlannedResourceCoverage(serviceOrderId: string): Promise<PlannedResourceCoverageRow[]> {
    const result = await this.pool().query<PlannedResourceCoverageRow>(
      `SELECT requirement_kind::text AS requirement_kind,
              resource_type_code, labor_type_code,
              planned_quantity::text AS planned_quantity,
              status::text AS status
       FROM so.planned_resources
       WHERE service_order_id = $1`,
      [serviceOrderId],
    );
    return result.rows;
  }

  async transitionExecution(
    input: ExecutionTransitionPersistenceInput,
  ): Promise<ExecutionTransitionResult> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');

      if (input.idempotencyKey) {
        const existing = await this.findIdempotencyInClient(
          client,
          input.serviceOrderId,
          input.commandName,
          input.idempotencyKey,
        );
        if (existing) {
          await client.query('COMMIT');
          return { outcome: 'success', rowVersion: existing.response_payload.rowVersion as number };
        }
      }

      const locked = await client.query<{ row_version: number; status: string }>(
        `SELECT row_version, status::text AS status
         FROM so.service_orders
         WHERE id = $1
         FOR UPDATE`,
        [input.serviceOrderId],
      );
      const current = locked.rows[0];
      if (!current || current.row_version !== input.rowVersion) {
        await client.query('ROLLBACK');
        return { outcome: 'version_conflict' };
      }
      if (current.status !== input.currentStatus) {
        await client.query('ROLLBACK');
        return { outcome: 'invalid_state' };
      }

      const transitionSql = this.transitionSql(input.transition);
      const updated = await client.query<{ row_version: number }>(
        `UPDATE so.service_orders
         SET status = $3::so.service_order_status,
             ${transitionSql},
             updated_by_identity_id = $4,
             updated_at = NOW(),
             row_version = row_version + 1
         WHERE id = $1
           AND row_version = $2
           AND status = $5::so.service_order_status
         RETURNING row_version`,
        [
          input.serviceOrderId,
          input.rowVersion,
          input.nextStatus,
          input.actorIdentityId,
          input.currentStatus,
        ],
      );
      if (!updated.rows[0]) {
        await client.query('ROLLBACK');
        return { outcome: 'invalid_state' };
      }

      await client.query(
        `INSERT INTO so.service_order_history_events
           (service_order_id, event_type, payload, actor_identity_id)
         VALUES ($1, $2, $3::jsonb, $4)`,
        [
          input.serviceOrderId,
          this.historyEventForTransition(input.transition),
          JSON.stringify({ fromStatus: input.currentStatus, toStatus: input.nextStatus }),
          input.actorIdentityId,
        ],
      );

      if (input.idempotencyKey) {
        await client.query(
          `INSERT INTO so.execution_command_idempotency
             (service_order_id, command_name, idempotency_key, response_payload)
           VALUES ($1, $2, $3, $4::jsonb)`,
          [
            input.serviceOrderId,
            input.commandName,
            input.idempotencyKey,
            JSON.stringify({ ...input.responsePayload, rowVersion: updated.rows[0].row_version }),
          ],
        );
      }

      await client.query('COMMIT');
      return { outcome: 'success', rowVersion: updated.rows[0].row_version };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async recordEntry(input: RecordExecutionEntryInput): Promise<RecordExecutionPersistenceResult> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');

      if (input.idempotencyKey) {
        const existing = await client.query<ExecutionEntryRow>(
          `SELECT ${ENTRY_RETURNING}
           FROM so.execution_entries
           WHERE idempotency_key = $1`,
          [input.idempotencyKey],
        );
        if (existing.rows[0]) {
          await client.query('COMMIT');
          return { outcome: 'idempotent', payload: { entry: existing.rows[0] } };
        }
      }

      const locked = await client.query<{ row_version: number; status: string }>(
        `SELECT row_version, status::text AS status
         FROM so.service_orders
         WHERE id = $1
         FOR UPDATE`,
        [input.serviceOrderId],
      );
      const current = locked.rows[0];
      if (!current || current.row_version !== input.rowVersion) {
        await client.query('ROLLBACK');
        return { outcome: 'version_conflict' };
      }
      if (!['IN_EXECUTION', 'PAUSED'].includes(current.status)) {
        await client.query('ROLLBACK');
        return { outcome: 'invalid_state' };
      }

      const inserted = await client.query<ExecutionEntryRow>(
        `INSERT INTO so.execution_entries (
           service_order_id, entry_type, evidence_kind, quantity_value, quantity_unit_code,
           text_value, context, actor_identity_id, idempotency_key
         ) VALUES (
           $1, $2::so.execution_entry_type, $3, $4::numeric, $5, $6, $7::jsonb, $8, $9
         )
         RETURNING ${ENTRY_RETURNING}`,
        [
          input.serviceOrderId,
          input.entryType,
          input.evidenceKind,
          input.quantityValue,
          input.quantityUnitCode,
          input.textValue,
          JSON.stringify(input.context),
          input.actorIdentityId,
          input.idempotencyKey ?? null,
        ],
      );
      const entry = inserted.rows[0];
      if (!entry) {
        await client.query('ROLLBACK');
        return { outcome: 'invalid_state' };
      }

      await client.query(
        `INSERT INTO so.execution_entry_history_events
           (execution_entry_id, event_type, payload, actor_identity_id)
         VALUES ($1, $2, $3::jsonb, $4)`,
        [entry.id, EXECUTION_ENTRY_HISTORY_EVENTS.Recorded, JSON.stringify({ entryType: input.entryType }), input.actorIdentityId],
      );

      const bumped = await client.query<{ row_version: number }>(
        `UPDATE so.service_orders
         SET updated_by_identity_id = $2, updated_at = NOW(), row_version = row_version + 1
         WHERE id = $1
         RETURNING row_version`,
        [input.serviceOrderId, input.actorIdentityId],
      );

      await client.query('COMMIT');
      return {
        outcome: 'success',
        entry,
        rowVersion: bumped.rows[0]?.row_version ?? input.rowVersion + 1,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (this.isIdempotencyViolation(error) && input.idempotencyKey) {
        const existing = await this.pool().query<ExecutionEntryRow>(
          `SELECT ${ENTRY_RETURNING} FROM so.execution_entries WHERE idempotency_key = $1`,
          [input.idempotencyKey],
        );
        if (existing.rows[0]) {
          return { outcome: 'idempotent', payload: { entry: existing.rows[0] } };
        }
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async recordEvidence(
    input: RecordExecutionEvidenceInput,
  ): Promise<RecordEvidencePersistenceResult> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');

      if (input.idempotencyKey) {
        const existing = await client.query<ExecutionEvidenceRow>(
          `SELECT id, service_order_id, evidence_kind, payload, actor_identity_id, recorded_at, idempotency_key
           FROM so.execution_evidence WHERE idempotency_key = $1`,
          [input.idempotencyKey],
        );
        if (existing.rows[0]) {
          await client.query('COMMIT');
          return { outcome: 'idempotent', payload: { evidence: existing.rows[0] } };
        }
      }

      const locked = await client.query<{ row_version: number; status: string }>(
        `SELECT row_version, status::text AS status FROM so.service_orders WHERE id = $1 FOR UPDATE`,
        [input.serviceOrderId],
      );
      const current = locked.rows[0];
      if (!current || current.row_version !== input.rowVersion) {
        await client.query('ROLLBACK');
        return { outcome: 'version_conflict' };
      }
      if (!['IN_EXECUTION', 'PAUSED'].includes(current.status)) {
        await client.query('ROLLBACK');
        return { outcome: 'invalid_state' };
      }

      const inserted = await client.query<ExecutionEvidenceRow>(
        `INSERT INTO so.execution_evidence
           (service_order_id, evidence_kind, payload, actor_identity_id, idempotency_key)
         VALUES ($1, $2, $3::jsonb, $4, $5)
         RETURNING id, service_order_id, evidence_kind, payload, actor_identity_id, recorded_at, idempotency_key`,
        [
          input.serviceOrderId,
          input.evidenceKind,
          JSON.stringify(input.payload),
          input.actorIdentityId,
          input.idempotencyKey ?? null,
        ],
      );
      const evidence = inserted.rows[0];
      if (!evidence) {
        await client.query('ROLLBACK');
        return { outcome: 'invalid_state' };
      }

      const bumped = await client.query<{ row_version: number }>(
        `UPDATE so.service_orders
         SET updated_by_identity_id = $2, updated_at = NOW(), row_version = row_version + 1
         WHERE id = $1
         RETURNING row_version`,
        [input.serviceOrderId, input.actorIdentityId],
      );

      await client.query('COMMIT');
      return {
        outcome: 'success',
        evidence,
        rowVersion: bumped.rows[0]?.row_version ?? input.rowVersion + 1,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (this.isIdempotencyViolation(error) && input.idempotencyKey) {
        const existing = await this.pool().query<ExecutionEvidenceRow>(
          `SELECT id, service_order_id, evidence_kind, payload, actor_identity_id, recorded_at, idempotency_key
           FROM so.execution_evidence WHERE idempotency_key = $1`,
          [input.idempotencyKey],
        );
        if (existing.rows[0]) {
          return { outcome: 'idempotent', payload: { evidence: existing.rows[0] } };
        }
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async recordOccurrence(
    input: RecordExecutionOccurrenceInput,
  ): Promise<RecordOccurrencePersistenceResult> {
    const client = await this.pool().connect();
    try {
      await client.query('BEGIN');

      if (input.idempotencyKey) {
        const existing = await client.query<ExecutionOccurrenceRow>(
          `SELECT id, service_order_id, occurrence_code, description, payload, actor_identity_id, recorded_at, idempotency_key
           FROM so.execution_occurrences WHERE idempotency_key = $1`,
          [input.idempotencyKey],
        );
        if (existing.rows[0]) {
          await client.query('COMMIT');
          return { outcome: 'idempotent', payload: { occurrence: existing.rows[0] } };
        }
      }

      const locked = await client.query<{ row_version: number; status: string }>(
        `SELECT row_version, status::text AS status FROM so.service_orders WHERE id = $1 FOR UPDATE`,
        [input.serviceOrderId],
      );
      const current = locked.rows[0];
      if (!current || current.row_version !== input.rowVersion) {
        await client.query('ROLLBACK');
        return { outcome: 'version_conflict' };
      }
      if (!['IN_EXECUTION', 'PAUSED'].includes(current.status)) {
        await client.query('ROLLBACK');
        return { outcome: 'invalid_state' };
      }

      const inserted = await client.query<ExecutionOccurrenceRow>(
        `INSERT INTO so.execution_occurrences
           (service_order_id, occurrence_code, description, payload, actor_identity_id, idempotency_key)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6)
         RETURNING id, service_order_id, occurrence_code, description, payload, actor_identity_id, recorded_at, idempotency_key`,
        [
          input.serviceOrderId,
          input.occurrenceCode,
          input.description,
          JSON.stringify(input.payload),
          input.actorIdentityId,
          input.idempotencyKey ?? null,
        ],
      );
      const occurrence = inserted.rows[0];
      if (!occurrence) {
        await client.query('ROLLBACK');
        return { outcome: 'invalid_state' };
      }

      const bumped = await client.query<{ row_version: number }>(
        `UPDATE so.service_orders
         SET updated_by_identity_id = $2, updated_at = NOW(), row_version = row_version + 1
         WHERE id = $1
         RETURNING row_version`,
        [input.serviceOrderId, input.actorIdentityId],
      );

      await client.query('COMMIT');
      return {
        outcome: 'success',
        occurrence,
        rowVersion: bumped.rows[0]?.row_version ?? input.rowVersion + 1,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (this.isIdempotencyViolation(error) && input.idempotencyKey) {
        const existing = await this.pool().query<ExecutionOccurrenceRow>(
          `SELECT id, service_order_id, occurrence_code, description, payload, actor_identity_id, recorded_at, idempotency_key
           FROM so.execution_occurrences WHERE idempotency_key = $1`,
          [input.idempotencyKey],
        );
        if (existing.rows[0]) {
          return { outcome: 'idempotent', payload: { occurrence: existing.rows[0] } };
        }
      }
      throw error;
    } finally {
      client.release();
    }
  }

  private async findIdempotencyInClient(
    client: PoolClient,
    serviceOrderId: string,
    commandName: string,
    idempotencyKey: string,
  ): Promise<ExecutionCommandIdempotencyRow | null> {
    const result = await client.query<ExecutionCommandIdempotencyRow>(
      `SELECT id, service_order_id, command_name, idempotency_key, response_payload, created_at
       FROM so.execution_command_idempotency
       WHERE service_order_id = $1 AND command_name = $2 AND idempotency_key = $3`,
      [serviceOrderId, commandName, idempotencyKey],
    );
    return result.rows[0] ?? null;
  }

  private transitionSql(transition: ExecutionTransitionPersistenceInput['transition']): string {
    switch (transition) {
      case 'start':
        return 'started_at = NOW(), started_by_identity_id = $4, paused_at = NULL, paused_by_identity_id = NULL';
      case 'pause':
        return 'paused_at = NOW(), paused_by_identity_id = $4';
      case 'resume':
        return 'paused_at = NULL, paused_by_identity_id = NULL';
      case 'complete':
        return 'completed_at = NOW(), completed_by_identity_id = $4';
      default:
        return '';
    }
  }

  private historyEventForTransition(
    transition: ExecutionTransitionPersistenceInput['transition'],
  ): string {
    switch (transition) {
      case 'start':
        return 'STARTED';
      case 'pause':
        return 'PAUSED';
      case 'resume':
        return 'RESUMED';
      case 'complete':
        return 'COMPLETED';
    }
  }

  private isIdempotencyViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const pgError = error as { code?: string; constraint?: string };
    return pgError.code === '23505' && (pgError.constraint?.includes('idempotency') ?? false);
  }
}
