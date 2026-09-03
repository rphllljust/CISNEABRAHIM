CREATE TYPE prc.three_way_match_classification AS ENUM (
  'MATCHED',
  'PARTIAL',
  'DIVERGENT',
  'REVIEW_REQUIRED'
);

CREATE TABLE prc.three_way_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  supplier_purchase_order_id uuid NOT NULL REFERENCES prc.supplier_purchase_orders(id),
  goods_receipt_id uuid REFERENCES prc.goods_receipts(id),
  supplier_invoice_id uuid REFERENCES prc.supplier_invoices(id),
  classification prc.three_way_match_classification NOT NULL,
  reasons text[] NOT NULL DEFAULT '{}',
  ordered_quantity numeric(18, 4) NOT NULL,
  received_quantity numeric(18, 4) NOT NULL,
  ordered_amount numeric(18, 4) NOT NULL,
  received_amount numeric(18, 4) NOT NULL,
  invoiced_amount numeric(18, 4) NOT NULL,
  receipt_count integer NOT NULL,
  invoice_count integer NOT NULL,
  idempotency_key text NOT NULL,
  actor_identity_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT three_way_matches_unit_chk CHECK (length(trim(unit_id)) > 0),
  CONSTRAINT three_way_matches_receipt_count_chk CHECK (receipt_count >= 0),
  CONSTRAINT three_way_matches_invoice_count_chk CHECK (invoice_count >= 0),
  CONSTRAINT three_way_matches_idempotency_uidx UNIQUE (idempotency_key)
);

COMMENT ON TABLE prc.three_way_matches IS
'Derived three-way conference of SupplierPurchaseOrder, Receipt and SupplierInvoice. Snapshot only; never updates origin documents and never auto-approves quantity or amount divergence.';

CREATE OR REPLACE VIEW rpt.read_three_way_matches AS
SELECT * FROM prc.three_way_matches OFFSET 0;
