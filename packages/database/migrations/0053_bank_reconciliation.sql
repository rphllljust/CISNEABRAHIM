CREATE TYPE fin.bank_statement_source_kind AS ENUM (
  'MANUAL',
  'OFX',
  'CNAB',
  'BANK_API',
  'AUTHORIZED_FILE'
);

CREATE TYPE fin.bank_statement_status AS ENUM ('OPEN', 'CLOSED');

CREATE TYPE fin.bank_statement_line_match_status AS ENUM (
  'UNMATCHED',
  'REVIEW_REQUIRED',
  'SUGGESTED',
  'MATCHED'
);

CREATE TYPE fin.reconciliation_status AS ENUM ('DRAFT', 'CONFIRMED', 'UNRECONCILED');

CREATE TYPE fin.reconciliation_match_method AS ENUM ('AUTO_EXACT', 'MANUAL');

CREATE TYPE fin.reconciliation_target_kind AS ENUM (
  'RECEIVABLE_SETTLEMENT',
  'PAYABLE_PAYMENT',
  'TRANSFER',
  'FINANCIAL_TRANSACTION'
);

CREATE TABLE fin.bank_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  financial_account_id uuid NOT NULL REFERENCES fin.financial_accounts(id),
  source_kind fin.bank_statement_source_kind NOT NULL,
  source_reference text NOT NULL,
  period_starts_on date NOT NULL,
  period_ends_on date NOT NULL,
  currency_code text NOT NULL,
  status fin.bank_statement_status NOT NULL DEFAULT 'OPEN',
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT bank_statements_range_chk CHECK (period_ends_on >= period_starts_on),
  CONSTRAINT bank_statements_source_ref_chk CHECK (length(trim(source_reference)) > 0),
  CONSTRAINT bank_statements_idempotency_chk CHECK (length(trim(idempotency_key)) > 0)
);

CREATE UNIQUE INDEX bank_statements_unit_idempotency_uidx
  ON fin.bank_statements (unit_id, idempotency_key);

COMMENT ON TABLE fin.bank_statements IS
'Bank statement imported into FINANCE. Source adapters (OFX/CNAB/API) are future ports. No ERP dependency.';

CREATE TABLE fin.bank_statement_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_statement_id uuid NOT NULL REFERENCES fin.bank_statements(id),
  line_number integer NOT NULL,
  occurred_on date NOT NULL,
  direction fin.financial_direction NOT NULL,
  amount numeric(18, 4) NOT NULL,
  description text NOT NULL,
  source_line_key text NOT NULL,
  external_reference text,
  match_status fin.bank_statement_line_match_status NOT NULL DEFAULT 'UNMATCHED',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT bank_statement_lines_amount_chk CHECK (amount > 0),
  CONSTRAINT bank_statement_lines_number_chk CHECK (line_number >= 1),
  CONSTRAINT bank_statement_lines_key_chk CHECK (length(trim(source_line_key)) > 0)
);

CREATE UNIQUE INDEX bank_statement_lines_source_key_uidx
  ON fin.bank_statement_lines (bank_statement_id, source_line_key);
CREATE UNIQUE INDEX bank_statement_lines_number_uidx
  ON fin.bank_statement_lines (bank_statement_id, line_number);

CREATE TABLE fin.reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  bank_statement_id uuid NOT NULL REFERENCES fin.bank_statements(id),
  bank_statement_line_id uuid NOT NULL REFERENCES fin.bank_statement_lines(id),
  status fin.reconciliation_status NOT NULL DEFAULT 'DRAFT',
  match_method fin.reconciliation_match_method NOT NULL,
  match_criteria text NOT NULL,
  confirmed_at timestamptz,
  confirmed_by_identity_id uuid REFERENCES identity.identities(id),
  unreconciled_at timestamptz,
  unreconciled_by_identity_id uuid REFERENCES identity.identities(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT reconciliations_criteria_chk CHECK (length(trim(match_criteria)) > 0)
);

CREATE UNIQUE INDEX reconciliations_confirmed_line_uidx
  ON fin.reconciliations (bank_statement_line_id)
  WHERE status = 'CONFIRMED';

CREATE TABLE fin.reconciliation_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_id uuid NOT NULL REFERENCES fin.reconciliations(id) ON DELETE CASCADE,
  bank_statement_line_id uuid NOT NULL REFERENCES fin.bank_statement_lines(id),
  target_kind fin.reconciliation_target_kind NOT NULL,
  target_id uuid NOT NULL,
  financial_transaction_id uuid NOT NULL REFERENCES fin.financial_transactions(id),
  amount numeric(18, 4) NOT NULL,
  is_active boolean NOT NULL DEFAULT TRUE,
  CONSTRAINT reconciliation_matches_amount_chk CHECK (amount > 0)
);

CREATE UNIQUE INDEX reconciliation_matches_active_line_uidx
  ON fin.reconciliation_matches (bank_statement_line_id)
  WHERE is_active;
CREATE UNIQUE INDEX reconciliation_matches_active_tx_uidx
  ON fin.reconciliation_matches (financial_transaction_id)
  WHERE is_active;

CREATE OR REPLACE VIEW rpt.read_bank_statements AS
SELECT * FROM fin.bank_statements OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_bank_statement_lines AS
SELECT * FROM fin.bank_statement_lines OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_reconciliations AS
SELECT * FROM fin.reconciliations OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_reconciliation_matches AS
SELECT * FROM fin.reconciliation_matches OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION fin.forbid_confirmed_reconciliation_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'CONFIRMED' THEN
      RAISE EXCEPTION 'BANK_RECONCILIATION_CONFIRMED_IMMUTABLE' USING ERRCODE = 'restrict_violation';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.status = 'CONFIRMED' THEN
    IF NEW.status = 'UNRECONCILED' AND NEW.unreconciled_at IS NOT NULL THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'BANK_RECONCILIATION_CONFIRMED_IMMUTABLE' USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER reconciliations_confirmed_immutable_trg
BEFORE UPDATE OR DELETE ON fin.reconciliations
FOR EACH ROW
EXECUTE FUNCTION fin.forbid_confirmed_reconciliation_mutation();