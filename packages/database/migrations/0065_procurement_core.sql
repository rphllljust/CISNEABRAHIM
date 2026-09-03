CREATE SCHEMA IF NOT EXISTS prc;

CREATE TYPE prc.purchase_request_status AS ENUM (
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'CANCELLED'
);

CREATE TYPE prc.supplier_purchase_order_status AS ENUM (
  'ISSUED',
  'PARTIALLY_RECEIVED',
  'RECEIVED',
  'CANCELLED'
);

CREATE TYPE prc.receipt_status AS ENUM ('POSTED');

CREATE TYPE prc.approval_decision AS ENUM ('APPROVED', 'REJECTED');

CREATE TABLE prc.purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  requester_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  justification text NOT NULL,
  currency_code text NOT NULL DEFAULT 'BRL',
  status prc.purchase_request_status NOT NULL DEFAULT 'DRAFT',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  submitted_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  CONSTRAINT purchase_requests_unit_chk CHECK (length(trim(unit_id)) > 0),
  CONSTRAINT purchase_requests_justification_chk CHECK (length(trim(justification)) > 0),
  CONSTRAINT purchase_requests_currency_chk CHECK (currency_code ~ '^[A-Z]{3}$'),
  CONSTRAINT purchase_requests_version_chk CHECK (version >= 1)
);

CREATE INDEX purchase_requests_unit_id_idx ON prc.purchase_requests (unit_id);

CREATE TABLE prc.purchase_request_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES prc.purchase_requests(id),
  line_number integer NOT NULL,
  description text NOT NULL,
  quantity numeric(18, 4) NOT NULL,
  unit_amount numeric(18, 4) NOT NULL,
  line_amount numeric(18, 4) NOT NULL,
  CONSTRAINT purchase_request_lines_number_chk CHECK (line_number >= 1),
  CONSTRAINT purchase_request_lines_description_chk CHECK (length(trim(description)) > 0),
  CONSTRAINT purchase_request_lines_quantity_chk CHECK (quantity > 0),
  CONSTRAINT purchase_request_lines_unit_amount_chk CHECK (unit_amount > 0),
  CONSTRAINT purchase_request_lines_line_amount_chk CHECK (line_amount > 0),
  CONSTRAINT purchase_request_lines_request_line_uidx UNIQUE (request_id, line_number)
);

CREATE TABLE prc.purchase_request_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES prc.purchase_requests(id),
  actor_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  decision prc.approval_decision NOT NULL,
  reason text,
  occurred_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT purchase_request_approvals_request_uidx UNIQUE (request_id)
);

CREATE TABLE prc.supplier_purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES prc.purchase_requests(id),
  supplier_id uuid NOT NULL,
  unit_id text NOT NULL,
  currency_code text NOT NULL,
  payment_terms text NOT NULL,
  status prc.supplier_purchase_order_status NOT NULL DEFAULT 'ISSUED',
  version integer NOT NULL DEFAULT 1,
  issued_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  cancelled_at timestamptz,
  cancel_reason text,
  CONSTRAINT supplier_purchase_orders_request_uidx UNIQUE (request_id),
  CONSTRAINT supplier_purchase_orders_unit_chk CHECK (length(trim(unit_id)) > 0),
  CONSTRAINT supplier_purchase_orders_currency_chk CHECK (currency_code ~ '^[A-Z]{3}$'),
  CONSTRAINT supplier_purchase_orders_terms_chk CHECK (length(trim(payment_terms)) > 0),
  CONSTRAINT supplier_purchase_orders_version_chk CHECK (version >= 1)
);

COMMENT ON TABLE prc.supplier_purchase_orders IS
'Internal supplier purchase order. Distinct from CustomerPurchaseOrder (com.purchase_orders). Not a stock movement and not a payable.';

CREATE TABLE prc.supplier_purchase_order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_purchase_order_id uuid NOT NULL REFERENCES prc.supplier_purchase_orders(id),
  request_line_id uuid NOT NULL REFERENCES prc.purchase_request_lines(id),
  line_number integer NOT NULL,
  description text NOT NULL,
  ordered_quantity numeric(18, 4) NOT NULL,
  received_quantity numeric(18, 4) NOT NULL DEFAULT 0,
  unit_amount numeric(18, 4) NOT NULL,
  line_amount numeric(18, 4) NOT NULL,
  CONSTRAINT spo_lines_number_chk CHECK (line_number >= 1),
  CONSTRAINT spo_lines_ordered_chk CHECK (ordered_quantity > 0),
  CONSTRAINT spo_lines_received_chk CHECK (received_quantity >= 0 AND received_quantity <= ordered_quantity),
  CONSTRAINT spo_lines_order_line_uidx UNIQUE (supplier_purchase_order_id, line_number)
);

CREATE TABLE prc.goods_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_purchase_order_id uuid NOT NULL REFERENCES prc.supplier_purchase_orders(id),
  status prc.receipt_status NOT NULL DEFAULT 'POSTED',
  currency_code text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT NOW(),
  actor_identity_id uuid NOT NULL REFERENCES identity.identities(id),
  idempotency_key text NOT NULL,
  payable_id uuid,
  CONSTRAINT goods_receipts_idempotency_uidx UNIQUE (idempotency_key)
);

CREATE INDEX goods_receipts_spo_id_idx ON prc.goods_receipts (supplier_purchase_order_id);

CREATE TABLE prc.goods_receipt_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id uuid NOT NULL REFERENCES prc.goods_receipts(id),
  spo_line_id uuid NOT NULL REFERENCES prc.supplier_purchase_order_lines(id),
  quantity numeric(18, 4) NOT NULL,
  unit_amount numeric(18, 4) NOT NULL,
  line_amount numeric(18, 4) NOT NULL,
  CONSTRAINT goods_receipt_lines_quantity_chk CHECK (quantity > 0)
);

CREATE OR REPLACE VIEW rpt.read_purchase_requests AS
SELECT * FROM prc.purchase_requests OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_purchase_request_lines AS
SELECT * FROM prc.purchase_request_lines OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_supplier_purchase_orders AS
SELECT * FROM prc.supplier_purchase_orders OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_supplier_purchase_order_lines AS
SELECT * FROM prc.supplier_purchase_order_lines OFFSET 0;

CREATE OR REPLACE VIEW rpt.read_goods_receipts AS
SELECT * FROM prc.goods_receipts OFFSET 0;
