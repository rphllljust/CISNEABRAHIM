export type ThreeWayMatchRow = {
  id: string;
  unit_id: string;
  supplier_purchase_order_id: string;
  goods_receipt_id: string | null;
  supplier_invoice_id: string | null;
  classification: string;
  reasons: string[];
  ordered_quantity: string;
  received_quantity: string;
  ordered_amount: string;
  received_amount: string;
  invoiced_amount: string;
  receipt_count: number;
  invoice_count: number;
  idempotency_key: string;
  actor_identity_id: string;
  created_at: Date | string;
};

export type ThreeWayMatchResponse = {
  id: string;
  unitId: string;
  supplierPurchaseOrderId: string;
  goodsReceiptId: string | null;
  supplierInvoiceId: string | null;
  classification: string;
  reasons: string[];
  orderedQuantity: string;
  receivedQuantity: string;
  orderedAmount: string;
  receivedAmount: string;
  invoicedAmount: string;
  receiptCount: number;
  invoiceCount: number;
};

export function toThreeWayMatchResponse(row: ThreeWayMatchRow): ThreeWayMatchResponse {
  return {
    id: row.id,
    unitId: row.unit_id,
    supplierPurchaseOrderId: row.supplier_purchase_order_id,
    goodsReceiptId: row.goods_receipt_id,
    supplierInvoiceId: row.supplier_invoice_id,
    classification: row.classification,
    reasons: row.reasons ?? [],
    orderedQuantity: row.ordered_quantity,
    receivedQuantity: row.received_quantity,
    orderedAmount: row.ordered_amount,
    receivedAmount: row.received_amount,
    invoicedAmount: row.invoiced_amount,
    receiptCount: row.receipt_count,
    invoiceCount: row.invoice_count,
  };
}
