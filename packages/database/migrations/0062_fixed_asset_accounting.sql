ALTER TYPE acc.posting_origin_kind ADD VALUE IF NOT EXISTS 'FIXED_ASSET';

ALTER TYPE acc.posting_event_kind ADD VALUE IF NOT EXISTS 'FIXED_ASSET_ACQUIRED';

ALTER TYPE acc.posting_event_kind ADD VALUE IF NOT EXISTS 'FIXED_ASSET_DISPOSED';

ALTER TYPE acc.posting_event_kind ADD VALUE IF NOT EXISTS 'FIXED_ASSET_TRANSFERRED';

ALTER TYPE acc.posting_event_kind ADD VALUE IF NOT EXISTS 'FIXED_ASSET_DEPRECIATED';

ALTER TYPE acc.journal_source_kind ADD VALUE IF NOT EXISTS 'FIXED_ASSET';
--> statement-breakpoint

CREATE TYPE acc.fixed_asset_status AS ENUM ('REGISTERED', 'CAPITALIZED', 'DISPOSED');

CREATE TYPE acc.fixed_asset_movement_kind AS ENUM (
  'ACQUISITION',
  'DISPOSAL',
  'TRANSFER',
  'DEPRECIATION'
);

CREATE TYPE acc.fixed_asset_movement_status AS ENUM ('POSTED', 'REVERSED');

CREATE TABLE acc.fixed_asset_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  operational_asset_id uuid NOT NULL,
  currency_code text NOT NULL,
  useful_life_months integer NOT NULL,
  cost_center_code text,
  status acc.fixed_asset_status NOT NULL DEFAULT 'REGISTERED',
  row_version integer NOT NULL DEFAULT 1,
  acquired_on date,
  disposed_on date,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT fixed_asset_registers_currency_chk CHECK (currency_code ~ '^[A-Z]{3}$'),
  CONSTRAINT fixed_asset_registers_life_chk CHECK (useful_life_months >= 1),
  CONSTRAINT fixed_asset_registers_row_version_chk CHECK (row_version >= 1),
  CONSTRAINT fixed_asset_registers_capitalized_chk CHECK (
    (status = 'REGISTERED' AND acquired_on IS NULL AND disposed_on IS NULL)
    OR (status = 'CAPITALIZED' AND acquired_on IS NOT NULL AND disposed_on IS NULL)
    OR (status = 'DISPOSED' AND acquired_on IS NOT NULL AND disposed_on IS NOT NULL)
  )
);

CREATE UNIQUE INDEX fixed_asset_registers_unit_asset_uidx
  ON acc.fixed_asset_registers (unit_id, operational_asset_id);

COMMENT ON TABLE acc.fixed_asset_registers IS
'Accounting fixed-asset register. Distinct from operational ast.physical_assets. Book value is derived from movements. Useful life is configuration only — no invented depreciation rate.';

CREATE TABLE acc.fixed_asset_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  register_id uuid NOT NULL REFERENCES acc.fixed_asset_registers(id),
  kind acc.fixed_asset_movement_kind NOT NULL,
  status acc.fixed_asset_movement_status NOT NULL DEFAULT 'POSTED',
  amount numeric(18, 4) NOT NULL,
  currency_code text NOT NULL,
  occurred_on date NOT NULL,
  from_cost_center_code text,
  to_cost_center_code text,
  journal_entry_id uuid REFERENCES acc.journal_entries(id),
  posting_request_id uuid REFERENCES acc.accounting_posting_requests(id),
  reversed_movement_id uuid REFERENCES acc.fixed_asset_movements(id),
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT fixed_asset_movements_amount_chk CHECK (amount > 0),
  CONSTRAINT fixed_asset_movements_currency_chk CHECK (currency_code ~ '^[A-Z]{3}$'),
  CONSTRAINT fixed_asset_movements_idempotency_chk CHECK (length(trim(idempotency_key)) > 0)
);

CREATE UNIQUE INDEX fixed_asset_movements_register_idempotency_uidx
  ON acc.fixed_asset_movements (register_id, idempotency_key);

CREATE UNIQUE INDEX fixed_asset_movements_one_posted_acquisition_uidx
  ON acc.fixed_asset_movements (register_id)
  WHERE kind = 'ACQUISITION' AND status = 'POSTED';

CREATE UNIQUE INDEX fixed_asset_movements_one_posted_disposal_uidx
  ON acc.fixed_asset_movements (register_id)
  WHERE kind = 'DISPOSAL' AND status = 'POSTED';

CREATE INDEX fixed_asset_movements_register_idx
  ON acc.fixed_asset_movements (register_id, occurred_on);

CREATE OR REPLACE VIEW rpt.read_fixed_asset_registers AS
SELECT * FROM acc.fixed_asset_registers OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_fixed_asset_movements AS
SELECT * FROM acc.fixed_asset_movements OFFSET 0;
