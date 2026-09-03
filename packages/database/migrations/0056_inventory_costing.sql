CREATE TYPE inv.costing_rule_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TYPE inv.costing_rule_version_status AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TYPE inv.stock_origin_kind AS ENUM (
  'RECEIPT',
  'ISSUE',
  'TRANSFER',
  'ADJUSTMENT',
  'REVERSAL'
);

CREATE TABLE inv.costing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  status inv.costing_rule_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT costing_rules_code_chk CHECK (length(trim(code)) > 0),
  CONSTRAINT costing_rules_name_chk CHECK (length(trim(name)) > 0)
);

CREATE UNIQUE INDEX costing_rules_unit_code_uidx
  ON inv.costing_rules (unit_id, code);
CREATE UNIQUE INDEX costing_rules_unit_active_uidx
  ON inv.costing_rules (unit_id)
  WHERE status = 'ACTIVE';

CREATE TABLE inv.costing_rule_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  costing_rule_id uuid NOT NULL REFERENCES inv.costing_rules(id),
  version_number integer NOT NULL,
  status inv.costing_rule_version_status NOT NULL DEFAULT 'DRAFT',
  method inv.costing_method_status NOT NULL DEFAULT 'UNDECIDED',
  required_context jsonb NOT NULL DEFAULT '[]'::jsonb,
  effective_from date NOT NULL,
  effective_to date,
  source_reference text NOT NULL,
  row_version integer NOT NULL DEFAULT 1,
  published_at timestamptz,
  published_by_identity_id uuid REFERENCES identity.identities(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT costing_rule_versions_number_chk CHECK (version_number >= 1),
  CONSTRAINT costing_rule_versions_method_chk CHECK (method = 'UNDECIDED'),
  CONSTRAINT costing_rule_versions_source_chk CHECK (length(trim(source_reference)) > 0),
  CONSTRAINT costing_rule_versions_range_chk CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CONSTRAINT costing_rule_versions_row_version_chk CHECK (row_version >= 1),
  CONSTRAINT costing_rule_versions_published_chk CHECK (
    (status = 'DRAFT' AND published_at IS NULL AND published_by_identity_id IS NULL)
    OR (status = 'PUBLISHED' AND published_at IS NOT NULL AND published_by_identity_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX costing_rule_versions_number_uidx
  ON inv.costing_rule_versions (costing_rule_id, version_number);

COMMENT ON TABLE inv.costing_rule_versions IS
'Versioned costing strategy. Only UNDECIDED is allowed until a business/accounting decision. FIFO/LIFO/average are not invented.';

ALTER TABLE inv.stock_movements
  ADD COLUMN unit_cost numeric(18, 4),
  ADD COLUMN total_cost numeric(18, 4),
  ADD COLUMN costing_rule_version_id uuid REFERENCES inv.costing_rule_versions(id),
  ADD COLUMN origin_kind inv.stock_origin_kind;

ALTER TABLE inv.stock_movements
  ADD CONSTRAINT stock_movements_cost_pair_chk CHECK (
    (unit_cost IS NULL AND total_cost IS NULL)
    OR (unit_cost IS NOT NULL AND total_cost IS NOT NULL AND unit_cost > 0 AND total_cost > 0)
  );

CREATE OR REPLACE VIEW rpt.read_stock_movements AS
SELECT * FROM inv.stock_movements OFFSET 0;

CREATE OR REPLACE FUNCTION inv.forbid_published_costing_rule_version_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'PUBLISHED' THEN
      RAISE EXCEPTION 'INVENTORY_COSTING_VERSION_IMMUTABLE' USING ERRCODE = 'restrict_violation';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.status = 'PUBLISHED' THEN
    RAISE EXCEPTION 'INVENTORY_COSTING_VERSION_IMMUTABLE' USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER costing_rule_versions_published_immutable_trg
BEFORE UPDATE OR DELETE ON inv.costing_rule_versions
FOR EACH ROW
EXECUTE FUNCTION inv.forbid_published_costing_rule_version_mutation();
