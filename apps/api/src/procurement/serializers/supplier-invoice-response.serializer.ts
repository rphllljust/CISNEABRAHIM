export type SupplierInvoiceRow = {
  id: string;
  unit_id: string;
  supplier_id: string;
  invoice_number: string;
  issued_on: string;
  due_date: string;
  currency_code: string;
  total_amount: string;
  payment_terms: string;
  supplier_purchase_order_id: string | null;
  goods_receipt_id: string | null;
  payable_id: string | null;
  status: string;
  version: number;
  idempotency_key: string;
  created_at: Date | string;
  updated_at: Date | string;
  validated_at: Date | string | null;
};

export type SupplierInvoiceResponse = {
  id: string;
  unitId: string;
  supplierId: string;
  invoiceNumber: string;
  issuedOn: string;
  dueDate: string;
  currencyCode: string;
  totalAmount: string;
  paymentTerms: string;
  supplierPurchaseOrderId: string | null;
  goodsReceiptId: string | null;
  payableId: string | null;
  status: string;
  version: number;
};

export function toSupplierInvoiceResponse(row: SupplierInvoiceRow): SupplierInvoiceResponse {
  return {
    id: row.id,
    unitId: row.unit_id,
    supplierId: row.supplier_id,
    invoiceNumber: row.invoice_number,
    issuedOn: String(row.issued_on).slice(0, 10),
    dueDate: String(row.due_date).slice(0, 10),
    currencyCode: row.currency_code,
    totalAmount: row.total_amount,
    paymentTerms: row.payment_terms,
    supplierPurchaseOrderId: row.supplier_purchase_order_id,
    goodsReceiptId: row.goods_receipt_id,
    payableId: row.payable_id,
    status: row.status,
    version: row.version,
  };
}
