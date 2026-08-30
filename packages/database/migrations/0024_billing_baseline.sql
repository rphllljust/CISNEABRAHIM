CREATE SCHEMA IF NOT EXISTS bil;

CREATE TYPE bil.billing_record_status AS ENUM ('PREPARED', 'VOIDED');

CREATE TYPE bil.payment_terms_source AS ENUM (
  'PURCHASE_ORDER',
  'PROPOSAL_SNAPSHOT',
  'CONTRACT_SNAPSHOT',
  'DECLARED'
);

CREATE TABLE bil.billing_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES so.service_orders(id),
  measurement_id uuid NOT NULL REFERENCES msr.measurements(id),
  client_id uuid NOT NULL REFERENCES pty.clients(id),
  unit_id text NOT NULL,
  status bil.billing_record_status NOT NULL DEFAULT 'PREPARED',
  proposal_id uuid REFERENCES com.proposals(id),
  purchase_order_id uuid REFERENCES com.purchase_orders(id),
  contract_reference text,
  client_legal_name_snapshot text NOT NULL,
  client_tax_id_snapshot text,
  billing_address_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  commercial_reference_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  currency_code text NOT NULL DEFAULT 'BRL',
  payment_terms text NOT NULL,
  payment_terms_source bil.payment_terms_source NOT NULL,
  payment_terms_authoritative text,
  total_amount numeric(18, 4) NOT NULL,
  prepared_at timestamptz NOT NULL DEFAULT NOW(),
  prepared_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  voided_at timestamptz,
  voided_by_identity_id uuid REFERENCES identity.identities(id),
  void_reason text,
  row_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT billing_records_currency_code_chk CHECK (length(trim(currency_code)) = 3),
  CONSTRAINT billing_records_row_version_positive_chk CHECK (row_version >= 1)
);

CREATE UNIQUE INDEX billing_records_measurement_prepared_uidx
  ON bil.billing_records (measurement_id)
  WHERE status = 'PREPARED';

CREATE INDEX billing_records_service_order_id_idx ON bil.billing_records (service_order_id);
CREATE INDEX billing_records_client_id_idx ON bil.billing_records (client_id);

CREATE TABLE bil.billing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_record_id uuid NOT NULL REFERENCES bil.billing_records(id) ON DELETE CASCADE,
  line_number integer NOT NULL,
  measurement_item_id uuid NOT NULL REFERENCES msr.measurement_items(id),
  source_execution_entry_id uuid REFERENCES so.execution_entries(id),
  unit_code text NOT NULL,
  quantity numeric(18, 6) NOT NULL,
  unit_price numeric(18, 4),
  line_amount numeric(18, 4) NOT NULL,
  pricing_line_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  line_label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT billing_items_line_number_positive_chk CHECK (line_number >= 1),
  UNIQUE (billing_record_id, line_number),
  UNIQUE (billing_record_id, measurement_item_id)
);

CREATE TABLE bil.billing_history_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_record_id uuid NOT NULL REFERENCES bil.billing_records(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_identity_id uuid REFERENCES identity.identities(id),
  occurred_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE bil.billing_command_idempotency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_record_id uuid REFERENCES bil.billing_records(id) ON DELETE CASCADE,
  service_order_id uuid NOT NULL REFERENCES so.service_orders(id),
  command_name text NOT NULL,
  idempotency_key text NOT NULL,
  response_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (service_order_id, command_name, idempotency_key)
);

CREATE INDEX billing_items_billing_record_id_idx ON bil.billing_items (billing_record_id);
CREATE INDEX billing_history_events_billing_record_id_idx ON bil.billing_history_events (billing_record_id);
