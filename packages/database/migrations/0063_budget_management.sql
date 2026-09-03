CREATE TYPE fin.budget_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TYPE fin.budget_version_status AS ENUM ('DRAFT', 'APPROVED');

CREATE TYPE fin.budget_period_status AS ENUM ('OPEN', 'CLOSED');

CREATE TABLE fin.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  currency_code text NOT NULL,
  status fin.budget_status NOT NULL DEFAULT 'ACTIVE',
  row_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT budgets_code_chk CHECK (length(trim(code)) > 0),
  CONSTRAINT budgets_name_chk CHECK (length(trim(name)) > 0),
  CONSTRAINT budgets_currency_chk CHECK (currency_code ~ '^[A-Z]{3}$'),
  CONSTRAINT budgets_row_version_chk CHECK (row_version >= 1)
);

CREATE UNIQUE INDEX budgets_unit_code_uidx ON fin.budgets (unit_id, code);

COMMENT ON TABLE fin.budgets IS
'Planning budget header. Distinct from JournalEntry. Budget never writes acc.journal_*.';

CREATE TABLE fin.budget_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES fin.budgets(id),
  version_number integer NOT NULL,
  status fin.budget_version_status NOT NULL DEFAULT 'DRAFT',
  approved_at timestamptz,
  approved_by_identity_id uuid REFERENCES identity.identities(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT budget_versions_number_chk CHECK (version_number >= 1),
  CONSTRAINT budget_versions_approved_chk CHECK (
    (status = 'DRAFT' AND approved_at IS NULL AND approved_by_identity_id IS NULL)
    OR (status = 'APPROVED' AND approved_at IS NOT NULL AND approved_by_identity_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX budget_versions_budget_number_uidx
  ON fin.budget_versions (budget_id, version_number);

CREATE UNIQUE INDEX budget_versions_one_draft_uidx
  ON fin.budget_versions (budget_id)
  WHERE status = 'DRAFT';

CREATE TABLE fin.budget_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_version_id uuid NOT NULL REFERENCES fin.budget_versions(id),
  period_key text NOT NULL,
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  status fin.budget_period_status NOT NULL DEFAULT 'OPEN',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT budget_periods_key_chk CHECK (period_key ~ '^[0-9]{4}-[0-9]{2}$'),
  CONSTRAINT budget_periods_range_chk CHECK (starts_on <= ends_on)
);

CREATE UNIQUE INDEX budget_periods_version_key_uidx
  ON fin.budget_periods (budget_version_id, period_key);

CREATE TABLE fin.budget_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_period_id uuid NOT NULL REFERENCES fin.budget_periods(id),
  line_number integer NOT NULL,
  amount numeric(18, 4) NOT NULL,
  currency_code text NOT NULL,
  cost_center_code text,
  expense_category_id uuid REFERENCES fin.expense_categories(id),
  account_id uuid,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT budget_lines_number_chk CHECK (line_number >= 1),
  CONSTRAINT budget_lines_amount_chk CHECK (amount > 0),
  CONSTRAINT budget_lines_currency_chk CHECK (currency_code ~ '^[A-Z]{3}$'),
  CONSTRAINT budget_lines_dimension_chk CHECK (
    cost_center_code IS NOT NULL
    OR expense_category_id IS NOT NULL
    OR account_id IS NOT NULL
  )
);

CREATE UNIQUE INDEX budget_lines_period_number_uidx
  ON fin.budget_lines (budget_period_id, line_number);

CREATE OR REPLACE FUNCTION fin.reject_approved_budget_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  version_status text;
BEGIN
  IF TG_TABLE_NAME = 'budget_lines' THEN
    SELECT v.status::text
      INTO version_status
    FROM fin.budget_periods p
    INNER JOIN fin.budget_versions v ON v.id = p.budget_version_id
    WHERE p.id = COALESCE(NEW.budget_period_id, OLD.budget_period_id);
  ELSIF TG_TABLE_NAME = 'budget_periods' THEN
    SELECT v.status::text
      INTO version_status
    FROM fin.budget_versions v
    WHERE v.id = COALESCE(NEW.budget_version_id, OLD.budget_version_id);
  ELSE
    RETURN NEW;
  END IF;

  IF version_status = 'APPROVED' THEN
    RAISE EXCEPTION 'BUDGET_VERSION_IMMUTABLE'
      USING ERRCODE = 'P0001';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER budget_lines_approved_immutable_trg
BEFORE INSERT OR UPDATE OR DELETE ON fin.budget_lines
FOR EACH ROW
EXECUTE FUNCTION fin.reject_approved_budget_mutation();

CREATE TRIGGER budget_periods_approved_immutable_trg
BEFORE INSERT OR UPDATE OR DELETE ON fin.budget_periods
FOR EACH ROW
EXECUTE FUNCTION fin.reject_approved_budget_mutation();

CREATE OR REPLACE VIEW rpt.read_budgets AS
SELECT * FROM fin.budgets OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_budget_versions AS
SELECT * FROM fin.budget_versions OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_budget_periods AS
SELECT * FROM fin.budget_periods OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_budget_lines AS
SELECT * FROM fin.budget_lines OFFSET 0;
