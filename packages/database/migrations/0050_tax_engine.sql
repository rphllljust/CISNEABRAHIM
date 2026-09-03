CREATE TYPE fis.tax_rule_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TYPE fis.tax_rule_version_status AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TYPE fis.tax_calculation_method AS ENUM ('PERCENT_OF_BASE', 'FIXED_AMOUNT');

CREATE TYPE fis.tax_rounding_mode AS ENUM ('HALF_UP');

CREATE TABLE fis.tax_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  status fis.tax_rule_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT tax_rules_code_chk CHECK (length(trim(code)) > 0),
  CONSTRAINT tax_rules_name_chk CHECK (length(trim(name)) > 0)
);

CREATE UNIQUE INDEX tax_rules_unit_code_uidx ON fis.tax_rules (unit_id, code);

CREATE TABLE fis.tax_rule_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_rule_id uuid NOT NULL REFERENCES fis.tax_rules(id),
  version_number integer NOT NULL,
  status fis.tax_rule_version_status NOT NULL DEFAULT 'DRAFT',
  calculation_method fis.tax_calculation_method NOT NULL,
  rounding_mode fis.tax_rounding_mode NOT NULL DEFAULT 'HALF_UP',
  rate numeric(18, 4),
  fixed_amount numeric(18, 4),
  source_reference text NOT NULL,
  effective_from date NOT NULL,
  effective_to date,
  specification jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_version integer NOT NULL DEFAULT 1,
  published_at timestamptz,
  published_by_identity_id uuid REFERENCES identity.identities(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT tax_rule_versions_number_chk CHECK (version_number >= 1),
  CONSTRAINT tax_rule_versions_source_chk CHECK (length(trim(source_reference)) > 0),
  CONSTRAINT tax_rule_versions_range_chk CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CONSTRAINT tax_rule_versions_row_version_chk CHECK (row_version >= 1),
  CONSTRAINT tax_rule_versions_method_chk CHECK (
    (calculation_method = 'PERCENT_OF_BASE' AND rate IS NOT NULL AND rate > 0 AND fixed_amount IS NULL)
    OR (calculation_method = 'FIXED_AMOUNT' AND fixed_amount IS NOT NULL AND fixed_amount > 0 AND rate IS NULL)
  ),
  CONSTRAINT tax_rule_versions_published_chk CHECK (
    (status = 'DRAFT' AND published_at IS NULL AND published_by_identity_id IS NULL)
    OR (status = 'PUBLISHED' AND published_at IS NOT NULL AND published_by_identity_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX tax_rule_versions_number_uidx
  ON fis.tax_rule_versions (tax_rule_id, version_number);
CREATE INDEX tax_rule_versions_rule_id_idx ON fis.tax_rule_versions (tax_rule_id);

CREATE TABLE fis.tax_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  currency_code text NOT NULL,
  base_amount numeric(18, 4) NOT NULL,
  effective_on date NOT NULL,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT tax_contexts_currency_chk CHECK (length(trim(currency_code)) = 3),
  CONSTRAINT tax_contexts_base_chk CHECK (base_amount > 0)
);

CREATE TABLE fis.tax_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  tax_rule_id uuid NOT NULL REFERENCES fis.tax_rules(id),
  tax_rule_version_id uuid NOT NULL REFERENCES fis.tax_rule_versions(id),
  tax_context_id uuid NOT NULL REFERENCES fis.tax_contexts(id),
  inputs jsonb NOT NULL,
  base_amount numeric(18, 4) NOT NULL,
  rate numeric(18, 4),
  result_amount numeric(18, 4) NOT NULL,
  calculated_at timestamptz NOT NULL DEFAULT NOW(),
  idempotency_key text NOT NULL,
  source_kind text,
  source_id uuid,
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT tax_calculations_base_chk CHECK (base_amount > 0),
  CONSTRAINT tax_calculations_result_chk CHECK (result_amount >= 0),
  CONSTRAINT tax_calculations_idempotency_chk CHECK (length(trim(idempotency_key)) > 0)
);

CREATE UNIQUE INDEX tax_calculations_unit_idempotency_uidx
  ON fis.tax_calculations (unit_id, idempotency_key);
CREATE INDEX tax_calculations_version_id_idx ON fis.tax_calculations (tax_rule_version_id);

CREATE TABLE fis.tax_calculation_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_calculation_id uuid NOT NULL REFERENCES fis.tax_calculations(id) ON DELETE CASCADE,
  line_number integer NOT NULL,
  component_label text NOT NULL,
  base_amount numeric(18, 4) NOT NULL,
  rate numeric(18, 4),
  result_amount numeric(18, 4) NOT NULL,
  detail_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT tax_calculation_lines_number_chk CHECK (line_number >= 1),
  CONSTRAINT tax_calculation_lines_label_chk CHECK (length(trim(component_label)) > 0)
);

CREATE UNIQUE INDEX tax_calculation_lines_number_uidx
  ON fis.tax_calculation_lines (tax_calculation_id, line_number);

CREATE OR REPLACE VIEW rpt.read_tax_rules AS
SELECT * FROM fis.tax_rules OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_tax_rule_versions AS
SELECT * FROM fis.tax_rule_versions OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_tax_contexts AS
SELECT * FROM fis.tax_contexts OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_tax_calculations AS
SELECT * FROM fis.tax_calculations OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_tax_calculation_lines AS
SELECT * FROM fis.tax_calculation_lines OFFSET 0;
--> statement-breakpoint
COMMENT ON VIEW rpt.read_tax_calculations IS
'TaxCalculation is not FiscalDocument and not JournalEntry. Historical rows reproduce from stored rule_version_id + inputs. No ledger posting.';
--> statement-breakpoint
CREATE OR REPLACE FUNCTION fis.forbid_published_tax_version_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'PUBLISHED' THEN
      RAISE EXCEPTION 'TAX_VERSION_IMMUTABLE' USING ERRCODE = 'restrict_violation';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.status = 'PUBLISHED' THEN
    RAISE EXCEPTION 'TAX_VERSION_IMMUTABLE' USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tax_rule_versions_published_immutable_trg
BEFORE UPDATE OR DELETE ON fis.tax_rule_versions
FOR EACH ROW
EXECUTE FUNCTION fis.forbid_published_tax_version_mutation();

CREATE OR REPLACE FUNCTION fis.forbid_tax_calculation_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'TAX_CALCULATION_IMMUTABLE' USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER tax_calculations_immutable_trg
BEFORE UPDATE OR DELETE ON fis.tax_calculations
FOR EACH ROW
EXECUTE FUNCTION fis.forbid_tax_calculation_mutation();

CREATE TRIGGER tax_calculation_lines_immutable_trg
BEFORE UPDATE OR DELETE ON fis.tax_calculation_lines
FOR EACH ROW
EXECUTE FUNCTION fis.forbid_tax_calculation_mutation();

CREATE TRIGGER tax_contexts_immutable_trg
BEFORE UPDATE OR DELETE ON fis.tax_contexts
FOR EACH ROW
EXECUTE FUNCTION fis.forbid_tax_calculation_mutation();