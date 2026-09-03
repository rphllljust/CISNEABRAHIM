export type OperationalCostEntryRow = {
  id: string;
  service_order_id: string;
  origin: string;
  source_execution_entry_id: string | null;
  category: string;
  cost_kind: string;
  description: string | null;
  amount: string;
  currency_code: string;
  quantity_value: string | null;
  quantity_unit_code: string | null;
  origin_context: Record<string, unknown>;
  actor_identity_id: string;
  recorded_at: string;
  idempotency_key: string | null;
  row_version: number;
};

export type RecordOperationalCostPersistenceInput = {
  serviceOrderId: string;
  origin: string;
  sourceExecutionEntryId: string | null;
  category: string;
  costKind: string;
  description: string | null;
  amount: string;
  currencyCode: string;
  quantityValue: string | null;
  quantityUnitCode: string | null;
  originContext: Record<string, unknown>;
  actorIdentityId: string;
  idempotencyKey: string | null;
  rowVersion: number;
};

export type RecordOperationalCostPersistenceResult =
  | { outcome: 'success'; entry: OperationalCostEntryRow; rowVersion: number }
  | { outcome: 'idempotent'; payload: { entry: OperationalCostEntryRow } }
  | { outcome: 'version_conflict' }
  | { outcome: 'invalid_state' }
  | { outcome: 'execution_entry_not_found' }
  | { outcome: 'duplicate_cost_entry' };

export const OPERATIONAL_COST_ENTRY_RETURNING = `
  id,
  service_order_id,
  origin::text AS origin,
  source_execution_entry_id,
  category::text AS category,
  cost_kind::text AS cost_kind,
  description,
  amount::text AS amount,
  currency_code,
  quantity_value::text AS quantity_value,
  quantity_unit_code,
  origin_context,
  actor_identity_id,
  recorded_at,
  idempotency_key,
  row_version
`;
