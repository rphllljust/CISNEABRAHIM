CREATE SCHEMA IF NOT EXISTS inv;

CREATE TYPE inv.inventory_item_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TYPE inv.warehouse_status AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TYPE inv.stock_movement_type AS ENUM ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT');

CREATE TYPE inv.stock_movement_status AS ENUM ('POSTED', 'REVERSED');

CREATE TYPE inv.transfer_leg AS ENUM ('ORIGIN', 'DESTINATION');

CREATE TYPE inv.adjustment_effect AS ENUM ('INCREASE', 'DECREASE');

CREATE TYPE inv.reservation_status AS ENUM ('ACTIVE', 'RELEASED', 'CONSUMED', 'CANCELLED');

CREATE TYPE inv.costing_method_status AS ENUM ('UNDECIDED');

CREATE TABLE inv.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  code text NOT NULL,
  name text NOT NULL,
  status inv.warehouse_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT warehouses_code_chk CHECK (length(trim(code)) > 0),
  CONSTRAINT warehouses_name_chk CHECK (length(trim(name)) > 0)
);

CREATE UNIQUE INDEX warehouses_unit_code_uidx ON inv.warehouses (unit_id, code);

CREATE TABLE inv.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  sku text NOT NULL,
  name text NOT NULL,
  status inv.inventory_item_status NOT NULL DEFAULT 'ACTIVE',
  allows_negative_stock boolean NOT NULL DEFAULT false,
  costing_method_status inv.costing_method_status NOT NULL DEFAULT 'UNDECIDED',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT inventory_items_sku_chk CHECK (length(trim(sku)) > 0),
  CONSTRAINT inventory_items_name_chk CHECK (length(trim(name)) > 0)
);

CREATE UNIQUE INDEX inventory_items_unit_sku_uidx ON inv.inventory_items (unit_id, sku);

COMMENT ON TABLE inv.inventory_items IS
'Quantity-controlled stock SKU. Not a physical asset (ast.physical_assets). Costing method remains UNDECIDED until a business/accounting decision.';

CREATE TABLE inv.stock_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  warehouse_id uuid NOT NULL REFERENCES inv.warehouses(id),
  inventory_item_id uuid NOT NULL REFERENCES inv.inventory_items(id),
  quantity numeric(18, 4) NOT NULL,
  status inv.reservation_status NOT NULL DEFAULT 'ACTIVE',
  idempotency_key text NOT NULL,
  source_kind text,
  source_id uuid,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  updated_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT stock_reservations_qty_chk CHECK (quantity > 0),
  CONSTRAINT stock_reservations_idempotency_chk CHECK (length(trim(idempotency_key)) > 0)
);

CREATE UNIQUE INDEX stock_reservations_unit_idempotency_uidx
  ON inv.stock_reservations (unit_id, idempotency_key);
CREATE INDEX stock_reservations_position_idx
  ON inv.stock_reservations (warehouse_id, inventory_item_id, status);

CREATE TABLE inv.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  warehouse_id uuid NOT NULL REFERENCES inv.warehouses(id),
  inventory_item_id uuid NOT NULL REFERENCES inv.inventory_items(id),
  movement_type inv.stock_movement_type NOT NULL,
  status inv.stock_movement_status NOT NULL DEFAULT 'POSTED',
  quantity numeric(18, 4) NOT NULL,
  signed_quantity numeric(18, 4) NOT NULL,
  counterpart_warehouse_id uuid REFERENCES inv.warehouses(id),
  transfer_group_id uuid,
  transfer_leg inv.transfer_leg,
  adjustment_effect inv.adjustment_effect,
  reservation_id uuid REFERENCES inv.stock_reservations(id),
  reversal_of_movement_id uuid REFERENCES inv.stock_movements(id),
  command_idempotency_key text NOT NULL,
  idempotency_key text NOT NULL,
  source_kind text,
  source_id uuid,
  occurred_on date NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  created_by_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  CONSTRAINT stock_movements_qty_chk CHECK (quantity > 0),
  CONSTRAINT stock_movements_idempotency_chk CHECK (length(trim(idempotency_key)) > 0),
  CONSTRAINT stock_movements_command_chk CHECK (length(trim(command_idempotency_key)) > 0),
  CONSTRAINT stock_movements_shape_chk CHECK (
    (movement_type = 'IN' AND transfer_group_id IS NULL AND transfer_leg IS NULL AND counterpart_warehouse_id IS NULL AND adjustment_effect IS NULL AND signed_quantity = quantity)
    OR (movement_type = 'OUT' AND transfer_group_id IS NULL AND transfer_leg IS NULL AND counterpart_warehouse_id IS NULL AND adjustment_effect IS NULL AND signed_quantity = -quantity)
    OR (movement_type = 'TRANSFER' AND transfer_group_id IS NOT NULL AND transfer_leg IS NOT NULL AND counterpart_warehouse_id IS NOT NULL AND counterpart_warehouse_id <> warehouse_id AND adjustment_effect IS NULL
        AND ((transfer_leg = 'ORIGIN' AND signed_quantity = -quantity) OR (transfer_leg = 'DESTINATION' AND signed_quantity = quantity)))
    OR (movement_type = 'ADJUSTMENT' AND transfer_group_id IS NULL AND transfer_leg IS NULL AND counterpart_warehouse_id IS NULL AND adjustment_effect IS NOT NULL
        AND ((adjustment_effect = 'INCREASE' AND signed_quantity = quantity) OR (adjustment_effect = 'DECREASE' AND signed_quantity = -quantity)))
  )
);

CREATE UNIQUE INDEX stock_movements_unit_idempotency_uidx
  ON inv.stock_movements (unit_id, idempotency_key);
CREATE INDEX stock_movements_command_idx
  ON inv.stock_movements (unit_id, command_idempotency_key);
CREATE INDEX stock_movements_position_idx
  ON inv.stock_movements (warehouse_id, inventory_item_id, status);

CREATE TABLE inv.stock_position_locks (
  warehouse_id uuid NOT NULL REFERENCES inv.warehouses(id),
  inventory_item_id uuid NOT NULL REFERENCES inv.inventory_items(id),
  PRIMARY KEY (warehouse_id, inventory_item_id)
);

CREATE OR REPLACE VIEW inv.stock_on_hand AS
SELECT
  unit_id,
  warehouse_id,
  inventory_item_id,
  SUM(signed_quantity) AS on_hand
FROM inv.stock_movements
WHERE status = 'POSTED'
GROUP BY unit_id, warehouse_id, inventory_item_id;
--> statement-breakpoint
CREATE OR REPLACE VIEW inv.stock_reserved AS
SELECT
  unit_id,
  warehouse_id,
  inventory_item_id,
  SUM(quantity) AS reserved
FROM inv.stock_reservations
WHERE status = 'ACTIVE'
GROUP BY unit_id, warehouse_id, inventory_item_id;
--> statement-breakpoint
CREATE OR REPLACE VIEW inv.stock_balances AS
SELECT
  COALESCE(h.unit_id, r.unit_id) AS unit_id,
  COALESCE(h.warehouse_id, r.warehouse_id) AS warehouse_id,
  COALESCE(h.inventory_item_id, r.inventory_item_id) AS inventory_item_id,
  COALESCE(h.on_hand, 0) AS on_hand,
  COALESCE(r.reserved, 0) AS reserved,
  COALESCE(h.on_hand, 0) - COALESCE(r.reserved, 0) AS available
FROM inv.stock_on_hand h
FULL OUTER JOIN inv.stock_reserved r
  ON h.unit_id = r.unit_id
 AND h.warehouse_id = r.warehouse_id
 AND h.inventory_item_id = r.inventory_item_id;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_warehouses AS
SELECT * FROM inv.warehouses OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_inventory_items AS
SELECT * FROM inv.inventory_items OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_stock_movements AS
SELECT * FROM inv.stock_movements OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_stock_reservations AS
SELECT * FROM inv.stock_reservations OFFSET 0;
--> statement-breakpoint
CREATE OR REPLACE VIEW rpt.read_stock_balances AS
SELECT * FROM inv.stock_balances OFFSET 0;
--> statement-breakpoint
COMMENT ON VIEW rpt.read_stock_balances IS
'StockBalance is a derived read model. On-hand comes from POSTED movements only. Not a writable ledger and not a physical asset.';
--> statement-breakpoint
CREATE OR REPLACE FUNCTION inv.forbid_stock_movement_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'INVENTORY_MOVEMENT_IMMUTABLE' USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER stock_movements_immutable_trg
BEFORE UPDATE OR DELETE ON inv.stock_movements
FOR EACH ROW
EXECUTE FUNCTION inv.forbid_stock_movement_mutation();