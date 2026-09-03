CREATE SCHEMA IF NOT EXISTS acc;

CREATE TYPE acc.chart_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TYPE acc.account_class AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

CREATE TYPE acc.account_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TYPE acc.period_status AS ENUM ('OPEN', 'CLOSED');

CREATE TYPE acc.journal_status AS ENUM ('DRAFT', 'POSTED');

CREATE TYPE acc.journal_kind AS ENUM ('ENTRY', 'REVERSAL');

CREATE TYPE acc.journal_direction AS ENUM ('DEBIT', 'CREDIT');

CREATE TYPE acc.journal_source_kind AS ENUM (
  'MANUAL',
  'BILLING',
  'SETTLEMENT',
  'PAYMENT',
  'INVENTORY',
  'PAYROLL',
  'TAX'
);

CREATE TABLE acc.charts_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  status acc.chart_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT charts_of_accounts_code_chk CHECK (length(trim(code)) > 0),
  CONSTRAINT charts_of_accounts_name_chk CHECK (length(trim(name)) > 0)
);

CREATE UNIQUE INDEX charts_of_accounts_unit_code_uidx ON acc.charts_of_accounts (unit_id, code);

CREATE TABLE acc.accounting_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_id uuid NOT NULL REFERENCES acc.charts_of_accounts(id),
  parent_id uuid REFERENCES acc.accounting_accounts(id),
  code text NOT NULL,
  name text NOT NULL,
  class acc.account_class NOT NULL,
  status acc.account_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT accounting_accounts_code_chk CHECK (length(trim(code)) > 0),
  CONSTRAINT accounting_accounts_name_chk CHECK (length(trim(name)) > 0)
);

CREATE UNIQUE INDEX accounting_accounts_chart_code_uidx ON acc.accounting_accounts (chart_id, code);
CREATE INDEX accounting_accounts_chart_id_idx ON acc.accounting_accounts (chart_id);

CREATE TABLE acc.accounting_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_id uuid NOT NULL REFERENCES acc.charts_of_accounts(id),
  unit_id text NOT NULL,
  code text NOT NULL,
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  status acc.period_status NOT NULL DEFAULT 'OPEN',
  closed_at timestamptz,
  closed_by_identity_id uuid REFERENCES identity.identities(id),
  close_reason text,
  reopened_at timestamptz,
  reopened_by_identity_id uuid REFERENCES identity.identities(id),
  reopen_reason text,
  reopen_count integer NOT NULL DEFAULT 0,
  row_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT accounting_periods_code_chk CHECK (length(trim(code)) > 0),
  CONSTRAINT accounting_periods_range_chk CHECK (ends_on >= starts_on),
  CONSTRAINT accounting_periods_row_version_chk CHECK (row_version >= 1),
  CONSTRAINT accounting_periods_closed_consistency_chk CHECK (
    (status = 'OPEN' AND closed_at IS NULL AND close_reason IS NULL)
    OR (status = 'CLOSED' AND closed_at IS NOT NULL AND close_reason IS NOT NULL)
  )
);

CREATE UNIQUE INDEX accounting_periods_chart_code_uidx ON acc.accounting_periods (chart_id, code);
CREATE INDEX accounting_periods_chart_id_idx ON acc.accounting_periods (chart_id);

CREATE TABLE acc.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_id uuid NOT NULL REFERENCES acc.charts_of_accounts(id),
  period_id uuid NOT NULL REFERENCES acc.accounting_periods(id),
  unit_id text NOT NULL,
  status acc.journal_status NOT NULL DEFAULT 'DRAFT',
  kind acc.journal_kind NOT NULL DEFAULT 'ENTRY',
  description text NOT NULL,
  occurred_on date NOT NULL,
  currency_code text NOT NULL,
  source_kind acc.journal_source_kind NOT NULL,
  source_id uuid NOT NULL,
  source_reference text NOT NULL,
  idempotency_key text NOT NULL,
  reverses_entry_id uuid REFERENCES acc.journal_entries(id),
  posted_at timestamptz,
  posted_by_identity_id uuid REFERENCES identity.identities(id),
  row_version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT journal_entries_description_chk CHECK (length(trim(description)) > 0),
  CONSTRAINT journal_entries_currency_code_chk CHECK (length(trim(currency_code)) = 3),
  CONSTRAINT journal_entries_source_reference_chk CHECK (length(trim(source_reference)) > 0),
  CONSTRAINT journal_entries_idempotency_key_chk CHECK (length(trim(idempotency_key)) > 0),
  CONSTRAINT journal_entries_row_version_chk CHECK (row_version >= 1),
  CONSTRAINT journal_entries_posted_consistency_chk CHECK (
    (status = 'DRAFT' AND posted_at IS NULL AND posted_by_identity_id IS NULL)
    OR (status = 'POSTED' AND posted_at IS NOT NULL AND posted_by_identity_id IS NOT NULL)
  ),
  CONSTRAINT journal_entries_reversal_consistency_chk CHECK (
    (kind = 'ENTRY' AND reverses_entry_id IS NULL)
    OR (kind = 'REVERSAL' AND reverses_entry_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX journal_entries_chart_idempotency_uidx
  ON acc.journal_entries (chart_id, idempotency_key);
CREATE UNIQUE INDEX journal_entries_source_idempotency_uidx
  ON acc.journal_entries (source_kind, source_id, idempotency_key);
CREATE INDEX journal_entries_period_id_idx ON acc.journal_entries (period_id);

CREATE TABLE acc.journal_entry_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id uuid NOT NULL REFERENCES acc.journal_entries(id) ON DELETE CASCADE,
  line_number integer NOT NULL,
  account_id uuid NOT NULL REFERENCES acc.accounting_accounts(id),
  direction acc.journal_direction NOT NULL,
  amount numeric(18, 4) NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT journal_entry_lines_number_chk CHECK (line_number >= 1),
  CONSTRAINT journal_entry_lines_amount_positive_chk CHECK (amount > 0)
);

CREATE UNIQUE INDEX journal_entry_lines_number_uidx
  ON acc.journal_entry_lines (journal_entry_id, line_number);
CREATE INDEX journal_entry_lines_account_id_idx ON acc.journal_entry_lines (account_id);

CREATE OR REPLACE VIEW rpt.read_charts_of_accounts AS
SELECT * FROM acc.charts_of_accounts OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_accounting_accounts AS
SELECT * FROM acc.accounting_accounts OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_accounting_periods AS
SELECT * FROM acc.accounting_periods OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_journal_entries AS
SELECT * FROM acc.journal_entries OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_journal_entry_lines AS
SELECT * FROM acc.journal_entry_lines OFFSET 0;
--> statement-breakpoint
COMMENT ON VIEW rpt.read_journal_entries IS
'Read-only accounting ledger contract. POSTED entries are immutable. SUM(DEBIT) must equal SUM(CREDIT). Not a fiscal book and not FINANCE treasury.';
--> statement-breakpoint
CREATE UNIQUE INDEX journal_entries_one_reversal_uidx
  ON acc.journal_entries (reverses_entry_id)
  WHERE reverses_entry_id IS NOT NULL;

CREATE OR REPLACE FUNCTION acc.forbid_posted_journal_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'POSTED' THEN
      RAISE EXCEPTION 'ACCOUNTING_ENTRY_IMMUTABLE' USING ERRCODE = 'restrict_violation';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.status = 'POSTED' THEN
    RAISE EXCEPTION 'ACCOUNTING_ENTRY_IMMUTABLE' USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER journal_entries_posted_immutable_trg
BEFORE UPDATE OR DELETE ON acc.journal_entries
FOR EACH ROW
EXECUTE FUNCTION acc.forbid_posted_journal_mutation();

CREATE OR REPLACE FUNCTION acc.forbid_posted_line_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  entry_status acc.journal_status;
  entry_id uuid;
BEGIN
  entry_id := COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
  SELECT status INTO entry_status FROM acc.journal_entries WHERE id = entry_id;
  IF entry_status = 'POSTED' THEN
    RAISE EXCEPTION 'ACCOUNTING_ENTRY_IMMUTABLE' USING ERRCODE = 'restrict_violation';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER journal_entry_lines_posted_immutable_trg
BEFORE INSERT OR UPDATE OR DELETE ON acc.journal_entry_lines
FOR EACH ROW
EXECUTE FUNCTION acc.forbid_posted_line_mutation();

CREATE OR REPLACE FUNCTION acc.assert_posted_entry_balanced()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  debit_total numeric(18, 4);
  credit_total numeric(18, 4);
  line_count integer;
BEGIN
  IF NEW.status <> 'POSTED' THEN
    RETURN NEW;
  END IF;
  SELECT
    COALESCE(SUM(CASE WHEN direction = 'DEBIT' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN direction = 'CREDIT' THEN amount ELSE 0 END), 0),
    COUNT(*)
  INTO debit_total, credit_total, line_count
  FROM acc.journal_entry_lines
  WHERE journal_entry_id = NEW.id;
  IF line_count < 2 OR debit_total <> credit_total THEN
    RAISE EXCEPTION 'ACCOUNTING_UNBALANCED_ENTRY' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER journal_entries_posted_balanced_trg
AFTER INSERT OR UPDATE OF status ON acc.journal_entries
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION acc.assert_posted_entry_balanced();