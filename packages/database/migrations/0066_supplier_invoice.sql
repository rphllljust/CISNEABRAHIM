CREATE TYPE prc.supplier_invoice_status AS ENUM ('DRAFT', 'VALIDATED', 'REJECTED');

CREATE TABLE prc.supplier_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id text NOT NULL,
  supplier_id uuid NOT NULL,
  invoice_number text NOT NULL,
  issued_on date NOT NULL,
  due_date date NOT NULL,
  currency_code text NOT NULL DEFAULT 'BRL',
  total_amount numeric(18, 4) NOT NULL,
  payment_terms text NOT NULL,
  supplier_purchase_order_id uuid REFERENCES prc.supplier_purchase_orders(id),
  goods_receipt_id uuid REFERENCES prc.goods_receipts(id),
  payable_id uuid,
  status prc.supplier_invoice_status NOT NULL DEFAULT 'DRAFT',
  version integer NOT NULL DEFAULT 1,
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  validated_at timestamptz,
  CONSTRAINT supplier_invoices_unit_chk CHECK (length(trim(unit_id)) > 0),
  CONSTRAINT supplier_invoices_number_chk CHECK (length(trim(invoice_number)) > 0),
  CONSTRAINT supplier_invoices_currency_chk CHECK (currency_code ~ '^[A-Z]{3}$'),
  CONSTRAINT supplier_invoices_amount_chk CHECK (total_amount > 0),
  CONSTRAINT supplier_invoices_terms_chk CHECK (length(trim(payment_terms)) > 0),
  CONSTRAINT supplier_invoices_version_chk CHECK (version >= 1),
  CONSTRAINT supplier_invoices_idempotency_uidx UNIQUE (idempotency_key),
  CONSTRAINT supplier_invoices_supplier_number_uidx UNIQUE (supplier_id, invoice_number)
);

CREATE UNIQUE INDEX supplier_invoices_receipt_uidx
  ON prc.supplier_invoices (goods_receipt_id)
  WHERE goods_receipt_id IS NOT NULL;

COMMENT ON TABLE prc.supplier_invoices IS
'Supplier invoice document. Distinct from Payable (fin.payables). Validation may open or attach at most one payable.';

CREATE OR REPLACE VIEW rpt.read_supplier_invoices AS
SELECT * FROM prc.supplier_invoices OFFSET 0;
