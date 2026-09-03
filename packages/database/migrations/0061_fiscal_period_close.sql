CREATE TYPE fis.fiscal_period_status AS ENUM ('OPEN', 'CLOSED');

CREATE TYPE fis.fiscal_period_close_run_status AS ENUM ('SUCCEEDED', 'BLOCKED');

CREATE TYPE fis.fiscal_period_close_check_kind AS ENUM (
  'DOCUMENTS',
  'ASSESSMENTS',
  'ADJUSTMENTS',
  'CRITICAL_PENDENCIES'
);

CREATE TYPE fis.fiscal_period_close_check_result AS ENUM ('PASS', 'FAIL');

CREATE TABLE fis.fiscal_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  period_key text NOT NULL,
  status fis.fiscal_period_status NOT NULL DEFAULT 'OPEN',
  row_version integer NOT NULL DEFAULT 1,
  closed_at timestamptz,
  closed_by_identity_id uuid REFERENCES identity.identities(id),
  reopened_at timestamptz,
  reopened_by_identity_id uuid REFERENCES identity.identities(id),
  reopen_reason text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT fiscal_periods_key_chk CHECK (period_key ~ '^[0-9]{4}-[0-9]{2}$'),
  CONSTRAINT fiscal_periods_row_version_chk CHECK (row_version >= 1),
  CONSTRAINT fiscal_periods_closed_consistency_chk CHECK (
    (status = 'OPEN' AND closed_at IS NULL)
    OR (status = 'CLOSED' AND closed_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX fiscal_periods_unit_key_uidx
  ON fis.fiscal_periods (unit_id, period_key);

COMMENT ON TABLE fis.fiscal_periods IS
'Fiscal competence period. CLOSED rejects ordinary writes. Correction is formal adjust or authorized reopen.';

CREATE TABLE fis.fiscal_period_close_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_period_id uuid NOT NULL REFERENCES fis.fiscal_periods(id),
  status fis.fiscal_period_close_run_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id)
);

CREATE INDEX fiscal_period_close_runs_period_idx
  ON fis.fiscal_period_close_runs (fiscal_period_id);

CREATE TABLE fis.fiscal_period_close_check_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  close_run_id uuid NOT NULL REFERENCES fis.fiscal_period_close_runs(id) ON DELETE CASCADE,
  kind fis.fiscal_period_close_check_kind NOT NULL,
  result fis.fiscal_period_close_check_result NOT NULL,
  blocking boolean NOT NULL,
  observed_count integer NOT NULL,
  detail text NOT NULL,
  CONSTRAINT fiscal_period_close_check_count_chk CHECK (observed_count >= 0),
  CONSTRAINT fiscal_period_close_check_detail_chk CHECK (length(trim(detail)) > 0)
);

CREATE UNIQUE INDEX fiscal_period_close_check_run_kind_uidx
  ON fis.fiscal_period_close_check_results (close_run_id, kind);

CREATE OR REPLACE VIEW rpt.read_fiscal_periods AS
SELECT * FROM fis.fiscal_periods OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_fiscal_period_close_runs AS
SELECT * FROM fis.fiscal_period_close_runs OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_fiscal_period_close_check_results AS
SELECT * FROM fis.fiscal_period_close_check_results OFFSET 0;

CREATE OR REPLACE FUNCTION fis.reject_ordinary_write_on_closed_period()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  competence_key text;
  target_unit text;
  closed_exists boolean;
BEGIN
  IF TG_TABLE_NAME = 'fiscal_documents' THEN
    target_unit := COALESCE(NEW.unit_id, OLD.unit_id);
    competence_key := to_char(COALESCE(NEW.issued_on, OLD.issued_on)::date, 'YYYY-MM');
    IF TG_OP = 'UPDATE' AND NEW.status = 'CANCELLED' AND OLD.status IS DISTINCT FROM 'CANCELLED' THEN
      RETURN NEW;
    END IF;
  ELSIF TG_TABLE_NAME = 'tax_assessments' THEN
    target_unit := COALESCE(NEW.unit_id, OLD.unit_id);
    competence_key := COALESCE(NEW.period_key, OLD.period_key);
    IF NEW.supersedes_assessment_id IS NOT NULL THEN
      RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.status IN ('ADJUSTED', 'CANCELLED') THEN
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM fis.fiscal_periods p
    WHERE p.unit_id = target_unit
      AND p.period_key = competence_key
      AND p.status = 'CLOSED'
  ) INTO closed_exists;

  IF closed_exists THEN
    RAISE EXCEPTION 'FISCAL_PERIOD_CLOSED'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER fiscal_documents_closed_period_trg
BEFORE INSERT OR UPDATE ON fis.fiscal_documents
FOR EACH ROW
EXECUTE FUNCTION fis.reject_ordinary_write_on_closed_period();

CREATE TRIGGER tax_assessments_closed_period_trg
BEFORE INSERT OR UPDATE ON fis.tax_assessments
FOR EACH ROW
EXECUTE FUNCTION fis.reject_ordinary_write_on_closed_period();
