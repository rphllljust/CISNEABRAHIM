CREATE TYPE fin.expense_status AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

CREATE TYPE fin.expense_approval_decision AS ENUM ('APPROVED', 'REJECTED');

CREATE TABLE fin.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  requester_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  expense_category_id uuid NOT NULL REFERENCES fin.expense_categories(id),
  cost_center_id uuid NOT NULL,
  cost_center_code text NOT NULL,
  total_amount numeric(18, 4) NOT NULL,
  currency_code text NOT NULL DEFAULT 'BRL',
  due_date date NOT NULL,
  payment_terms text NOT NULL,
  description text NOT NULL,
  receipt_document_id uuid,
  reimbursable boolean NOT NULL DEFAULT true,
  status fin.expense_status NOT NULL DEFAULT 'DRAFT',
  version integer NOT NULL DEFAULT 1,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT expenses_idempotency_uidx UNIQUE (idempotency_key),
  CONSTRAINT expenses_unit_chk CHECK (length(trim(unit_id)) > 0),
  CONSTRAINT expenses_cost_center_code_chk CHECK (length(trim(cost_center_code)) > 0),
  CONSTRAINT expenses_payment_terms_chk CHECK (length(trim(payment_terms)) > 0),
  CONSTRAINT expenses_description_chk CHECK (length(trim(description)) > 0),
  CONSTRAINT expenses_currency_chk CHECK (currency_code ~ '^[A-Z]{3}$'),
  CONSTRAINT expenses_amount_chk CHECK (total_amount > 0),
  CONSTRAINT expenses_version_chk CHECK (version >= 1)
);

CREATE TABLE fin.expense_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES fin.expenses(id),
  line_number integer NOT NULL,
  description text NOT NULL,
  amount numeric(18, 4) NOT NULL,
  CONSTRAINT expense_items_line_uidx UNIQUE (expense_id, line_number),
  CONSTRAINT expense_items_line_chk CHECK (line_number >= 1),
  CONSTRAINT expense_items_description_chk CHECK (length(trim(description)) > 0),
  CONSTRAINT expense_items_amount_chk CHECK (amount > 0)
);

CREATE TABLE fin.expense_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES fin.expenses(id),
  decision fin.expense_approval_decision NOT NULL,
  actor_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  approval_rule_id uuid,
  reason text,
  decided_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT expense_approvals_expense_uidx UNIQUE (expense_id)
);

CREATE TABLE fin.expense_reimbursements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES fin.expenses(id),
  payable_id uuid NOT NULL REFERENCES fin.payables(id),
  amount numeric(18, 4) NOT NULL,
  currency_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT expense_reimbursements_expense_uidx UNIQUE (expense_id),
  CONSTRAINT expense_reimbursements_payable_uidx UNIQUE (payable_id),
  CONSTRAINT expense_reimbursements_amount_chk CHECK (amount > 0),
  CONSTRAINT expense_reimbursements_currency_chk CHECK (currency_code ~ '^[A-Z]{3}$')
);

COMMENT ON TABLE fin.expenses IS
'Expense is a finance document distinct from Payable. Approval may open at most one OPERATIONAL_EXPENSE payable via reimbursement.';

CREATE OR REPLACE VIEW rpt.read_expenses AS
SELECT * FROM fin.expenses OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_expense_items AS
SELECT * FROM fin.expense_items OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_expense_approvals AS
SELECT * FROM fin.expense_approvals OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_expense_reimbursements AS
SELECT * FROM fin.expense_reimbursements OFFSET 0;
