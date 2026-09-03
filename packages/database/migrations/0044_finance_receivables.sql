CREATE SCHEMA IF NOT EXISTS fin;

CREATE TYPE fin.receivable_lifecycle AS ENUM ('ACTIVE', 'CANCELLED');

CREATE TYPE fin.receivable_origin_kind AS ENUM ('BILLING_DOCUMENT');

CREATE TYPE fin.settlement_status AS ENUM ('POSTED');

CREATE TABLE fin.receivables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  client_id uuid NOT NULL,
  origin_kind fin.receivable_origin_kind NOT NULL,
  origin_billing_document_id uuid NOT NULL,
  origin_billing_record_id uuid NOT NULL,
  origin_service_order_id uuid NOT NULL,
  origin_measurement_id uuid NOT NULL,
  principal numeric(18, 4) NOT NULL,
  currency_code text NOT NULL,
  due_date date NOT NULL,
  payment_terms text NOT NULL,
  external_reference text,
  lifecycle fin.receivable_lifecycle NOT NULL DEFAULT 'ACTIVE',
  cancelled_at timestamptz,
  cancelled_by_identity_id uuid REFERENCES identity.identities(id),
  cancel_reason text,
  row_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT receivables_principal_positive_chk CHECK (principal > 0),
  CONSTRAINT receivables_currency_code_chk CHECK (length(trim(currency_code)) = 3),
  CONSTRAINT receivables_payment_terms_chk CHECK (length(trim(payment_terms)) > 0),
  CONSTRAINT receivables_row_version_positive_chk CHECK (row_version >= 1),
  CONSTRAINT receivables_cancelled_consistency_chk CHECK (
    (lifecycle = 'ACTIVE' AND cancelled_at IS NULL AND cancel_reason IS NULL)
    OR (lifecycle = 'CANCELLED' AND cancelled_at IS NOT NULL AND cancel_reason IS NOT NULL)
  )
);

CREATE UNIQUE INDEX receivables_origin_billing_document_uidx
  ON fin.receivables (origin_billing_document_id);

CREATE INDEX receivables_client_id_idx ON fin.receivables (client_id);
CREATE INDEX receivables_unit_id_idx ON fin.receivables (unit_id);
CREATE INDEX receivables_due_date_idx ON fin.receivables (due_date);

CREATE TABLE fin.receivable_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receivable_id uuid NOT NULL REFERENCES fin.receivables(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  principal numeric(18, 4) NOT NULL,
  due_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT receivable_installments_number_positive_chk CHECK (installment_number >= 1),
  CONSTRAINT receivable_installments_principal_positive_chk CHECK (principal > 0)
);

CREATE UNIQUE INDEX receivable_installments_number_uidx
  ON fin.receivable_installments (receivable_id, installment_number);

CREATE TABLE fin.settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receivable_id uuid NOT NULL REFERENCES fin.receivables(id),
  installment_id uuid REFERENCES fin.receivable_installments(id),
  amount numeric(18, 4) NOT NULL,
  currency_code text NOT NULL,
  status fin.settlement_status NOT NULL DEFAULT 'POSTED',
  settled_at timestamptz NOT NULL,
  idempotency_key text NOT NULL,
  external_reference text,
  actor_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT settlements_amount_positive_chk CHECK (amount > 0),
  CONSTRAINT settlements_currency_code_chk CHECK (length(trim(currency_code)) = 3),
  CONSTRAINT settlements_idempotency_key_chk CHECK (length(trim(idempotency_key)) > 0)
);

CREATE UNIQUE INDEX settlements_receivable_idempotency_uidx
  ON fin.settlements (receivable_id, idempotency_key);

CREATE INDEX settlements_receivable_id_idx ON fin.settlements (receivable_id);

CREATE OR REPLACE VIEW rpt.read_receivables AS
SELECT * FROM fin.receivables OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_receivable_installments AS
SELECT * FROM fin.receivable_installments OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_settlements AS
SELECT * FROM fin.settlements OFFSET 0;
--> statement-breakpoint
COMMENT ON VIEW rpt.read_receivables IS
'Read-only cross-context application contract. Domain writes remain owned by FINANCE.';
