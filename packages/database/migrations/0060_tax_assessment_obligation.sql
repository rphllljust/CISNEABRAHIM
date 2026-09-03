CREATE TYPE fis.tax_assessment_status AS ENUM ('DRAFT', 'FINALIZED', 'ADJUSTED', 'CANCELLED');

CREATE TYPE fis.tax_obligation_status AS ENUM ('OPEN', 'CANCELLED');

CREATE TYPE fis.tax_assessment_event_type AS ENUM ('CREATED', 'FINALIZED', 'ADJUSTED', 'CANCELLED');

CREATE TABLE fis.tax_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  tax_calculation_id uuid NOT NULL REFERENCES fis.tax_calculations(id),
  tax_rule_id uuid NOT NULL REFERENCES fis.tax_rules(id),
  tax_rule_version_id uuid NOT NULL REFERENCES fis.tax_rule_versions(id),
  tax_component text NOT NULL,
  period_key text NOT NULL,
  currency_code text NOT NULL,
  assessed_amount numeric(18, 4) NOT NULL,
  status fis.tax_assessment_status NOT NULL DEFAULT 'DRAFT',
  supersedes_assessment_id uuid REFERENCES fis.tax_assessments(id),
  idempotency_key text NOT NULL,
  row_version integer NOT NULL DEFAULT 1,
  finalized_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT tax_assessments_component_chk CHECK (length(trim(tax_component)) > 0),
  CONSTRAINT tax_assessments_period_key_chk CHECK (period_key ~ '^[0-9]{4}-[0-9]{2}$'),
  CONSTRAINT tax_assessments_currency_chk CHECK (length(trim(currency_code)) = 3),
  CONSTRAINT tax_assessments_amount_positive_chk CHECK (assessed_amount > 0),
  CONSTRAINT tax_assessments_row_version_chk CHECK (row_version >= 1),
  CONSTRAINT tax_assessments_idempotency_chk CHECK (length(trim(idempotency_key)) > 0),
  CONSTRAINT tax_assessments_finalized_consistency_chk CHECK (
    (status <> 'FINALIZED' AND finalized_at IS NULL)
    OR (status = 'FINALIZED' AND finalized_at IS NOT NULL)
    OR (status IN ('ADJUSTED', 'CANCELLED'))
  ),
  CONSTRAINT tax_assessments_cancelled_consistency_chk CHECK (
    (status <> 'CANCELLED' AND cancelled_at IS NULL AND cancel_reason IS NULL)
    OR (status = 'CANCELLED' AND cancelled_at IS NOT NULL AND cancel_reason IS NOT NULL)
    OR (status = 'ADJUSTED' AND cancel_reason IS NOT NULL)
  )
);

CREATE UNIQUE INDEX tax_assessments_unit_idempotency_uidx
  ON fis.tax_assessments (unit_id, idempotency_key);

CREATE UNIQUE INDEX tax_assessments_active_tax_period_uidx
  ON fis.tax_assessments (unit_id, tax_rule_id, period_key)
  WHERE status IN ('DRAFT', 'FINALIZED');

CREATE UNIQUE INDEX tax_assessments_active_calculation_uidx
  ON fis.tax_assessments (tax_calculation_id)
  WHERE status IN ('DRAFT', 'FINALIZED');

CREATE INDEX tax_assessments_unit_period_idx
  ON fis.tax_assessments (unit_id, period_key);

COMMENT ON TABLE fis.tax_assessments IS
'Tax assessment owned by FISCAL. Amounts come from stored TaxCalculation Numeric results. Cancel/adjust keep the row.';

CREATE TABLE fis.tax_obligations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_assessment_id uuid NOT NULL REFERENCES fis.tax_assessments(id),
  unit_id text NOT NULL,
  tax_rule_id uuid NOT NULL REFERENCES fis.tax_rules(id),
  tax_component text NOT NULL,
  period_key text NOT NULL,
  currency_code text NOT NULL,
  amount numeric(18, 4) NOT NULL,
  status fis.tax_obligation_status NOT NULL DEFAULT 'OPEN',
  origin_calculation_id uuid NOT NULL REFERENCES fis.tax_calculations(id),
  payable_id uuid,
  payable_principal_snapshot numeric(18, 4),
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT tax_obligations_component_chk CHECK (length(trim(tax_component)) > 0),
  CONSTRAINT tax_obligations_period_key_chk CHECK (period_key ~ '^[0-9]{4}-[0-9]{2}$'),
  CONSTRAINT tax_obligations_currency_chk CHECK (length(trim(currency_code)) = 3),
  CONSTRAINT tax_obligations_amount_positive_chk CHECK (amount > 0),
  CONSTRAINT tax_obligations_cancelled_consistency_chk CHECK (
    (status = 'OPEN' AND cancelled_at IS NULL AND cancel_reason IS NULL)
    OR (status = 'CANCELLED' AND cancelled_at IS NOT NULL AND cancel_reason IS NOT NULL)
  )
);

CREATE UNIQUE INDEX tax_obligations_assessment_tax_period_uidx
  ON fis.tax_obligations (tax_assessment_id, tax_rule_id, period_key);

CREATE UNIQUE INDEX tax_obligations_active_tax_period_uidx
  ON fis.tax_obligations (unit_id, tax_rule_id, tax_component, period_key)
  WHERE status = 'OPEN';

COMMENT ON TABLE fis.tax_obligations IS
'Fiscal obligation generated from a finalized assessment. Finance opens Payable by origin TAX_OBLIGATION + this id. No DELETE.';

CREATE TABLE fis.tax_assessment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_assessment_id uuid NOT NULL REFERENCES fis.tax_assessments(id),
  event_type fis.tax_assessment_event_type NOT NULL,
  payload jsonb NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT NOW(),
  actor_identity_id uuid NOT NULL REFERENCES identity.identities(id)
);

CREATE INDEX tax_assessment_events_assessment_idx
  ON fis.tax_assessment_events (tax_assessment_id);

CREATE OR REPLACE FUNCTION fis.reject_tax_obligation_history_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'TAX_HISTORY_IMMUTABLE'
    USING ERRCODE = 'P0001';
END;
$$;

CREATE TRIGGER tax_assessments_no_delete_trg
BEFORE DELETE ON fis.tax_assessments
FOR EACH ROW
EXECUTE FUNCTION fis.reject_tax_obligation_history_delete();

CREATE TRIGGER tax_obligations_no_delete_trg
BEFORE DELETE ON fis.tax_obligations
FOR EACH ROW
EXECUTE FUNCTION fis.reject_tax_obligation_history_delete();

CREATE TRIGGER tax_assessment_events_no_delete_trg
BEFORE DELETE ON fis.tax_assessment_events
FOR EACH ROW
EXECUTE FUNCTION fis.reject_tax_obligation_history_delete();

CREATE OR REPLACE VIEW rpt.read_tax_assessments AS
SELECT * FROM fis.tax_assessments OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_tax_obligations AS
SELECT * FROM fis.tax_obligations OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_tax_assessment_events AS
SELECT * FROM fis.tax_assessment_events OFFSET 0;

COMMENT ON VIEW rpt.read_tax_obligations IS
'TaxObligation is Fiscal-owned. Payable is opened by Finance on origin TAX_OBLIGATION. Amounts are Numeric copies of stored TaxCalculation results.';
