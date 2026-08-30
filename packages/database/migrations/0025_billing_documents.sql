CREATE TYPE bil.billing_document_status AS ENUM ('FINALIZED', 'CANCELLED');

CREATE TABLE bil.billing_document_number_sequences (
  sequence_year integer PRIMARY KEY,
  next_number bigint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT billing_document_number_sequences_year_chk CHECK (sequence_year >= 2000),
  CONSTRAINT billing_document_number_sequences_next_positive_chk CHECK (next_number >= 1)
);

CREATE TABLE bil.billing_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_record_id uuid NOT NULL REFERENCES bil.billing_records(id),
  service_order_id uuid NOT NULL REFERENCES so.service_orders(id),
  measurement_id uuid NOT NULL REFERENCES msr.measurements(id),
  client_id uuid NOT NULL REFERENCES pty.clients(id),
  unit_id text NOT NULL,
  document_number text NOT NULL,
  sequence_year integer NOT NULL,
  sequence_number bigint NOT NULL,
  version_number integer NOT NULL DEFAULT 1,
  replaces_document_id uuid REFERENCES bil.billing_documents(id),
  status bil.billing_document_status NOT NULL DEFAULT 'FINALIZED',
  document_category text NOT NULL DEFAULT 'NOTA_FATURA',
  emitter_legal_name text NOT NULL,
  emitter_tax_id text NOT NULL,
  emitter_address_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  client_legal_name_snapshot text NOT NULL,
  client_tax_id_snapshot text,
  billing_address_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  commercial_reference_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  proposal_id uuid REFERENCES com.proposals(id),
  purchase_order_id uuid REFERENCES com.purchase_orders(id),
  purchase_order_number_snapshot text,
  contract_reference text,
  currency_code text NOT NULL DEFAULT 'BRL',
  payment_terms text NOT NULL,
  due_date date,
  total_amount numeric(18, 4) NOT NULL,
  issued_at timestamptz NOT NULL,
  stored_document_id uuid REFERENCES doc.documents(id),
  artifact_sha256 text,
  artifact_byte_size bigint,
  cancelled_at timestamptz,
  cancelled_by_identity_id uuid REFERENCES identity.identities(id),
  cancel_reason text,
  row_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT billing_documents_document_number_not_empty_chk CHECK (length(trim(document_number)) > 0),
  CONSTRAINT billing_documents_row_version_positive_chk CHECK (row_version >= 1),
  CONSTRAINT billing_documents_version_positive_chk CHECK (version_number >= 1),
  CONSTRAINT billing_documents_currency_code_chk CHECK (length(trim(currency_code)) = 3),
  CONSTRAINT billing_documents_finalized_artifact_chk CHECK (
    status <> 'FINALIZED'
    OR (
      stored_document_id IS NOT NULL
      AND artifact_sha256 IS NOT NULL
      AND length(trim(artifact_sha256)) > 0
      AND artifact_byte_size IS NOT NULL
      AND artifact_byte_size > 0
    )
  )
);

CREATE UNIQUE INDEX billing_documents_document_number_uidx ON bil.billing_documents (document_number);
CREATE UNIQUE INDEX billing_documents_year_sequence_uidx ON bil.billing_documents (sequence_year, sequence_number);
CREATE UNIQUE INDEX billing_documents_active_per_record_uidx
  ON bil.billing_documents (billing_record_id)
  WHERE status = 'FINALIZED';

CREATE INDEX billing_documents_billing_record_id_idx ON bil.billing_documents (billing_record_id);
CREATE INDEX billing_documents_service_order_id_idx ON bil.billing_documents (service_order_id);

CREATE TABLE bil.billing_document_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_document_id uuid NOT NULL REFERENCES bil.billing_documents(id) ON DELETE CASCADE,
  line_number integer NOT NULL,
  billing_item_id uuid REFERENCES bil.billing_items(id) ON DELETE SET NULL,
  measurement_item_id uuid REFERENCES msr.measurement_items(id),
  unit_code text NOT NULL,
  quantity numeric(18, 6) NOT NULL,
  unit_price numeric(18, 4),
  line_amount numeric(18, 4) NOT NULL,
  line_label text NOT NULL,
  pricing_line_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT billing_document_items_line_number_positive_chk CHECK (line_number >= 1),
  UNIQUE (billing_document_id, line_number)
);

CREATE INDEX billing_document_items_billing_document_id_idx ON bil.billing_document_items (billing_document_id);

CREATE TABLE bil.billing_document_history_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_document_id uuid NOT NULL REFERENCES bil.billing_documents(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_identity_id uuid REFERENCES identity.identities(id),
  occurred_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX billing_document_history_events_billing_document_id_idx
  ON bil.billing_document_history_events (billing_document_id);

CREATE TABLE bil.billing_document_command_idempotency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_document_id uuid REFERENCES bil.billing_documents(id) ON DELETE CASCADE,
  billing_record_id uuid NOT NULL REFERENCES bil.billing_records(id),
  command_name text NOT NULL,
  idempotency_key text NOT NULL,
  response_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (billing_record_id, command_name, idempotency_key)
);
