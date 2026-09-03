CREATE TYPE fin.payable_lifecycle AS ENUM ('ACTIVE', 'CANCELLED');

CREATE TYPE fin.payable_origin_kind AS ENUM (
  'SUPPLIER_INVOICE',
  'PURCHASE',
  'OPERATIONAL_EXPENSE',
  'PAYROLL_OBLIGATION',
  'TAX_OBLIGATION',
  'MANUAL_AUTHORIZED_EXPENSE'
);

CREATE TYPE fin.expense_category_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TYPE fin.payment_kind AS ENUM ('PAYMENT', 'REVERSAL');

CREATE TABLE fin.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  status fin.expense_category_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT expense_categories_code_chk CHECK (length(trim(code)) > 0),
  CONSTRAINT expense_categories_name_chk CHECK (length(trim(name)) > 0)
);

CREATE UNIQUE INDEX expense_categories_code_uidx ON fin.expense_categories (code);

CREATE TABLE fin.payables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  counterparty_id uuid NOT NULL,
  origin_kind fin.payable_origin_kind NOT NULL,
  origin_id uuid NOT NULL,
  origin_reference text NOT NULL,
  expense_category_id uuid NOT NULL REFERENCES fin.expense_categories(id),
  cost_center_id uuid NOT NULL,
  cost_center_code text NOT NULL,
  principal numeric(18, 4) NOT NULL,
  currency_code text NOT NULL,
  due_date date NOT NULL,
  payment_terms text NOT NULL,
  external_reference text,
  lifecycle fin.payable_lifecycle NOT NULL DEFAULT 'ACTIVE',
  cancelled_at timestamptz,
  cancelled_by_identity_id uuid REFERENCES identity.identities(id),
  cancel_reason text,
  row_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT payables_principal_positive_chk CHECK (principal > 0),
  CONSTRAINT payables_currency_code_chk CHECK (length(trim(currency_code)) = 3),
  CONSTRAINT payables_payment_terms_chk CHECK (length(trim(payment_terms)) > 0),
  CONSTRAINT payables_origin_reference_chk CHECK (length(trim(origin_reference)) > 0),
  CONSTRAINT payables_cost_center_code_chk CHECK (length(trim(cost_center_code)) > 0),
  CONSTRAINT payables_row_version_positive_chk CHECK (row_version >= 1),
  CONSTRAINT payables_cancelled_consistency_chk CHECK (
    (lifecycle = 'ACTIVE' AND cancelled_at IS NULL AND cancel_reason IS NULL)
    OR (lifecycle = 'CANCELLED' AND cancelled_at IS NOT NULL AND cancel_reason IS NOT NULL)
  )
);

CREATE UNIQUE INDEX payables_origin_uidx ON fin.payables (origin_kind, origin_id);
CREATE INDEX payables_unit_id_idx ON fin.payables (unit_id);
CREATE INDEX payables_due_date_idx ON fin.payables (due_date);
CREATE INDEX payables_expense_category_id_idx ON fin.payables (expense_category_id);

CREATE TABLE fin.payable_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payable_id uuid NOT NULL REFERENCES fin.payables(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  principal numeric(18, 4) NOT NULL,
  due_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT payable_installments_number_positive_chk CHECK (installment_number >= 1),
  CONSTRAINT payable_installments_principal_positive_chk CHECK (principal > 0)
);

CREATE UNIQUE INDEX payable_installments_number_uidx
  ON fin.payable_installments (payable_id, installment_number);

CREATE TABLE fin.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payable_id uuid NOT NULL REFERENCES fin.payables(id),
  installment_id uuid NOT NULL REFERENCES fin.payable_installments(id),
  kind fin.payment_kind NOT NULL DEFAULT 'PAYMENT',
  amount numeric(18, 4) NOT NULL,
  currency_code text NOT NULL,
  paid_at timestamptz NOT NULL,
  idempotency_key text NOT NULL,
  payment_reference text NOT NULL,
  origin_kind fin.payable_origin_kind NOT NULL,
  origin_id uuid NOT NULL,
  origin_reference text NOT NULL,
  reverses_payment_id uuid REFERENCES fin.payments(id),
  actor_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT payments_amount_positive_chk CHECK (amount > 0),
  CONSTRAINT payments_currency_code_chk CHECK (length(trim(currency_code)) = 3),
  CONSTRAINT payments_idempotency_key_chk CHECK (length(trim(idempotency_key)) > 0),
  CONSTRAINT payments_payment_reference_chk CHECK (length(trim(payment_reference)) > 0),
  CONSTRAINT payments_reversal_consistency_chk CHECK (
    (kind = 'PAYMENT' AND reverses_payment_id IS NULL)
    OR (kind = 'REVERSAL' AND reverses_payment_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX payments_payable_idempotency_uidx ON fin.payments (payable_id, idempotency_key);
CREATE INDEX payments_payable_id_idx ON fin.payments (payable_id);
CREATE INDEX payments_installment_id_idx ON fin.payments (installment_id);

CREATE OR REPLACE VIEW rpt.read_expense_categories AS
SELECT * FROM fin.expense_categories OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_payables AS
SELECT * FROM fin.payables OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_payable_installments AS
SELECT * FROM fin.payable_installments OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_payments AS
SELECT * FROM fin.payments OFFSET 0;
--> statement-breakpoint
COMMENT ON VIEW rpt.read_payables IS
'Read-only cross-context application contract. Domain writes remain owned by FINANCE. Client PurchaseOrder is not a payable origin.';