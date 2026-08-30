export type ExecutionCommandIdempotencyRow = {
  id: string;
  service_order_id: string;
  command_name: string;
  idempotency_key: string;
  response_payload: Record<string, unknown>;
  created_at: string;
};

export type ExecutionEntryRow = {
  id: string;
  service_order_id: string;
  entry_type: string;
  evidence_kind: string | null;
  quantity_value: string | null;
  quantity_unit_code: string | null;
  text_value: string | null;
  context: Record<string, unknown>;
  actor_identity_id: string;
  recorded_at: string;
  idempotency_key: string | null;
  row_version: number;
};

export type ExecutionEvidenceRow = {
  id: string;
  service_order_id: string;
  evidence_kind: string;
  payload: Record<string, unknown>;
  actor_identity_id: string;
  recorded_at: string;
  idempotency_key: string | null;
};

export type ExecutionOccurrenceRow = {
  id: string;
  service_order_id: string;
  occurrence_code: string;
  description: string;
  payload: Record<string, unknown>;
  actor_identity_id: string;
  recorded_at: string;
  idempotency_key: string | null;
};

export type ExecutionTransitionResult =
  | { outcome: 'success'; rowVersion: number }
  | { outcome: 'version_conflict' }
  | { outcome: 'invalid_state' };

export type RecordExecutionEntryInput = {
  serviceOrderId: string;
  rowVersion: number;
  actorIdentityId: string;
  entryType: string;
  evidenceKind: string | null;
  quantityValue: string | null;
  quantityUnitCode: string | null;
  textValue: string | null;
  context: Record<string, unknown>;
  idempotencyKey?: string | null;
};

export type RecordExecutionEvidenceInput = {
  serviceOrderId: string;
  rowVersion: number;
  actorIdentityId: string;
  evidenceKind: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string | null;
};

export type RecordExecutionOccurrenceInput = {
  serviceOrderId: string;
  rowVersion: number;
  actorIdentityId: string;
  occurrenceCode: string;
  description: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string | null;
};

export type ExecutionTransitionPersistenceInput = {
  serviceOrderId: string;
  rowVersion: number;
  actorIdentityId: string;
  currentStatus: string;
  nextStatus: string;
  transition: 'start' | 'pause' | 'resume' | 'complete';
  commandName: string;
  idempotencyKey?: string | null;
  responsePayload: Record<string, unknown>;
};

export type RecordExecutionPersistenceResult =
  | { outcome: 'success'; entry: ExecutionEntryRow; rowVersion: number }
  | { outcome: 'version_conflict' }
  | { outcome: 'invalid_state' }
  | { outcome: 'idempotent'; payload: Record<string, unknown> };

export type RecordEvidencePersistenceResult =
  | { outcome: 'success'; evidence: ExecutionEvidenceRow; rowVersion: number }
  | { outcome: 'version_conflict' }
  | { outcome: 'invalid_state' }
  | { outcome: 'idempotent'; payload: Record<string, unknown> };

export type RecordOccurrencePersistenceResult =
  | { outcome: 'success'; occurrence: ExecutionOccurrenceRow; rowVersion: number }
  | { outcome: 'version_conflict' }
  | { outcome: 'invalid_state' }
  | { outcome: 'idempotent'; payload: Record<string, unknown> };
