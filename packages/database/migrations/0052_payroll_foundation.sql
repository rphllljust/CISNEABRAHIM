CREATE SCHEMA IF NOT EXISTS pay;

CREATE TYPE pay.employment_contract_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TYPE pay.payroll_period_status AS ENUM ('OPEN', 'CALCULATED', 'CLOSED');

CREATE TYPE pay.payroll_event_kind AS ENUM ('EARNING', 'DEDUCTION', 'EMPLOYER_CHARGE');

CREATE TYPE pay.payroll_formula_status AS ENUM ('UNDECIDED');

CREATE TABLE pay.employment_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  code text NOT NULL,
  display_name text NOT NULL,
  status pay.employment_contract_status NOT NULL DEFAULT 'ACTIVE',
  person_ref uuid,
  starts_on date NOT NULL,
  ends_on date,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT employment_contracts_code_chk CHECK (length(trim(code)) > 0),
  CONSTRAINT employment_contracts_name_chk CHECK (length(trim(display_name)) > 0),
  CONSTRAINT employment_contracts_range_chk CHECK (ends_on IS NULL OR ends_on >= starts_on)
);

CREATE UNIQUE INDEX employment_contracts_unit_code_uidx
  ON pay.employment_contracts (unit_id, code);

COMMENT ON TABLE pay.employment_contracts IS
'Employment contract in PAYROLL. Not Person identity, not LaborType, not LaborAssignment. person_ref is an opaque UUID without FK to operations.';

CREATE TABLE pay.payroll_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  competence_year integer NOT NULL,
  competence_month integer NOT NULL,
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  status pay.payroll_period_status NOT NULL DEFAULT 'OPEN',
  row_version integer NOT NULL DEFAULT 1,
  calculated_at timestamptz,
  closed_at timestamptz,
  reopened_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT payroll_periods_year_chk CHECK (competence_year >= 2000 AND competence_year <= 2100),
  CONSTRAINT payroll_periods_month_chk CHECK (competence_month >= 1 AND competence_month <= 12),
  CONSTRAINT payroll_periods_range_chk CHECK (ends_on >= starts_on),
  CONSTRAINT payroll_periods_row_version_chk CHECK (row_version >= 1)
);

CREATE UNIQUE INDEX payroll_periods_competence_uidx
  ON pay.payroll_periods (unit_id, competence_year, competence_month);

CREATE TABLE pay.payroll_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  payroll_period_id uuid NOT NULL REFERENCES pay.payroll_periods(id),
  employment_contract_id uuid NOT NULL REFERENCES pay.employment_contracts(id),
  event_kind pay.payroll_event_kind NOT NULL,
  amount numeric(18, 4) NOT NULL,
  component_label text NOT NULL,
  description text NOT NULL,
  formula_status pay.payroll_formula_status NOT NULL DEFAULT 'UNDECIDED',
  idempotency_key text NOT NULL,
  source_kind text,
  source_id uuid,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT payroll_events_amount_chk CHECK (amount > 0),
  CONSTRAINT payroll_events_label_chk CHECK (length(trim(component_label)) > 0),
  CONSTRAINT payroll_events_idempotency_chk CHECK (length(trim(idempotency_key)) > 0)
);

CREATE UNIQUE INDEX payroll_events_period_idempotency_uidx
  ON pay.payroll_events (payroll_period_id, idempotency_key);
CREATE INDEX payroll_events_period_contract_idx
  ON pay.payroll_events (payroll_period_id, employment_contract_id);

CREATE TABLE pay.payroll_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  payroll_period_id uuid NOT NULL REFERENCES pay.payroll_periods(id),
  employment_contract_id uuid NOT NULL REFERENCES pay.employment_contracts(id),
  calculation_number integer NOT NULL,
  inputs jsonb NOT NULL,
  formula_status pay.payroll_formula_status NOT NULL DEFAULT 'UNDECIDED',
  calculated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT payroll_calculations_number_chk CHECK (calculation_number >= 1)
);

CREATE UNIQUE INDEX payroll_calculations_number_uidx
  ON pay.payroll_calculations (payroll_period_id, employment_contract_id, calculation_number);

CREATE TABLE pay.payroll_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_calculation_id uuid NOT NULL REFERENCES pay.payroll_calculations(id) ON DELETE CASCADE,
  earning_total numeric(18, 4) NOT NULL,
  deduction_total numeric(18, 4) NOT NULL,
  employer_charge_total numeric(18, 4) NOT NULL,
  net_total numeric(18, 4) NOT NULL,
  detail_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT payroll_results_calc_uidx UNIQUE (payroll_calculation_id)
);

CREATE OR REPLACE VIEW rpt.read_employment_contracts AS
SELECT * FROM pay.employment_contracts OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_payroll_periods AS
SELECT * FROM pay.payroll_periods OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_payroll_events AS
SELECT * FROM pay.payroll_events OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_payroll_calculations AS
SELECT * FROM pay.payroll_calculations OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_payroll_results AS
SELECT * FROM pay.payroll_results OFFSET 0;
--> statement-breakpoint
COMMENT ON VIEW rpt.read_payroll_results IS
'PayrollResult is derived from registered conceptual events only. Not a journal entry. Legal formulas remain UNDECIDED.';
--> statement-breakpoint
CREATE OR REPLACE FUNCTION pay.forbid_closed_period_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  period_id uuid;
  period_status pay.payroll_period_status;
BEGIN
  period_id := COALESCE(NEW.payroll_period_id, OLD.payroll_period_id);
  SELECT status INTO period_status FROM pay.payroll_periods WHERE id = period_id;
  IF period_status = 'CLOSED' THEN
    RAISE EXCEPTION 'PAYROLL_PERIOD_CLOSED' USING ERRCODE = 'restrict_violation';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER payroll_events_closed_period_trg
BEFORE INSERT OR UPDATE OR DELETE ON pay.payroll_events
FOR EACH ROW
EXECUTE FUNCTION pay.forbid_closed_period_event();

CREATE OR REPLACE FUNCTION pay.forbid_payroll_result_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'PAYROLL_RESULT_IMMUTABLE' USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER payroll_results_immutable_trg
BEFORE UPDATE OR DELETE ON pay.payroll_results
FOR EACH ROW
EXECUTE FUNCTION pay.forbid_payroll_result_mutation();

CREATE TRIGGER payroll_calculations_immutable_trg
BEFORE UPDATE OR DELETE ON pay.payroll_calculations
FOR EACH ROW
EXECUTE FUNCTION pay.forbid_payroll_result_mutation();