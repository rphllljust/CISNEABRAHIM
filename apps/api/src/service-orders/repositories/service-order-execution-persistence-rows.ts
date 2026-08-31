import type { ExecutionTransitionPersistenceInput } from './service-order-execution.repository.types';

export const EXECUTION_ENTRY_RETURNING = `
  id, service_order_id, entry_type::text AS entry_type, evidence_kind,
  quantity_value::text AS quantity_value, quantity_unit_code, text_value, context,
  actor_identity_id, recorded_at, idempotency_key, row_version
`;

export function executionTransitionSql(
  transition: ExecutionTransitionPersistenceInput['transition'],
): string {
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

export function historyEventForExecutionTransition(
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

import { isIdempotencyKeyViolation } from '../../infrastructure/database/pg-unique-violation';

export function isExecutionIdempotencyViolation(error: unknown): boolean {
  return isIdempotencyKeyViolation(error);
}
