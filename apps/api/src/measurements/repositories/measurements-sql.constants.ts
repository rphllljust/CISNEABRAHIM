export const MEASUREMENT_RETURNING = `
  id, service_order_id, unit_id, status::text AS status, commercial_reference_snapshot,
  submitted_at, submitted_by_identity_id, review_started_at, review_started_by_identity_id,
  decided_at, decided_by_identity_id, rejection_reason,
  row_version, created_at, updated_at, created_by_identity_id, updated_by_identity_id
`;

export const MEASUREMENT_ITEM_RETURNING = `
  id, measurement_id, line_number, source_execution_entry_id, unit_code,
  actual_quantity::text AS actual_quantity,
  measured_quantity::text AS measured_quantity,
  unit_price::text AS unit_price,
  line_amount::text AS line_amount,
  pricing_line_snapshot, notes, created_at, updated_at
`;
