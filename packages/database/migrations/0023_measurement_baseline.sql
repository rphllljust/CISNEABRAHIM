CREATE SCHEMA IF NOT EXISTS msr;

CREATE TYPE msr.measurement_status AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED'
);

CREATE TABLE msr.measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES so.service_orders(id),
  unit_id text NOT NULL,
  status msr.measurement_status NOT NULL DEFAULT 'DRAFT',
  commercial_reference_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz,
  submitted_by_identity_id uuid REFERENCES identity.identities(id),
  review_started_at timestamptz,
  review_started_by_identity_id uuid REFERENCES identity.identities(id),
  decided_at timestamptz,
  decided_by_identity_id uuid REFERENCES identity.identities(id),
  rejection_reason text,
  row_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id)
);

CREATE UNIQUE INDEX measurement_service_order_active_uq
  ON msr.measurements (service_order_id)
  WHERE status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED');

CREATE TABLE msr.measurement_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  measurement_id uuid NOT NULL REFERENCES msr.measurements(id) ON DELETE CASCADE,
  measurement_item_id uuid NOT NULL,
  adjustment_quantity numeric(18, 6) NOT NULL,
  unit_code text NOT NULL,
  reason text NOT NULL,
  authorized_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE msr.measurement_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  measurement_id uuid NOT NULL REFERENCES msr.measurements(id) ON DELETE CASCADE,
  line_number integer NOT NULL,
  source_execution_entry_id uuid REFERENCES so.execution_entries(id),
  unit_code text NOT NULL,
  actual_quantity numeric(18, 6) NOT NULL,
  measured_quantity numeric(18, 6) NOT NULL,
  unit_price numeric(18, 4),
  line_amount numeric(18, 4),
  pricing_line_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT measurement_item_origin_ck CHECK (source_execution_entry_id IS NOT NULL),
  UNIQUE (measurement_id, line_number),
  UNIQUE (measurement_id, source_execution_entry_id)
);

ALTER TABLE msr.measurement_adjustments
  ADD CONSTRAINT measurement_adjustments_item_fk
  FOREIGN KEY (measurement_item_id) REFERENCES msr.measurement_items(id) ON DELETE CASCADE;

CREATE TABLE msr.measurement_history_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  measurement_id uuid NOT NULL REFERENCES msr.measurements(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_identity_id uuid REFERENCES identity.identities(id),
  occurred_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE msr.measurement_command_idempotency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  measurement_id uuid NOT NULL REFERENCES msr.measurements(id) ON DELETE CASCADE,
  command_name text NOT NULL,
  idempotency_key text NOT NULL,
  response_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (measurement_id, command_name, idempotency_key)
);

CREATE INDEX measurement_items_measurement_id_idx ON msr.measurement_items (measurement_id);
CREATE INDEX measurement_adjustments_measurement_id_idx ON msr.measurement_adjustments (measurement_id);
CREATE INDEX measurement_history_events_measurement_id_idx ON msr.measurement_history_events (measurement_id);
