export type PurchaseRequestLineRow = {
  id: string;
  line_number: number;
  description: string;
  quantity: string;
  unit_amount: string;
  line_amount: string;
};

export type PurchaseRequestRow = {
  id: string;
  unit_id: string;
  requester_identity_id: string;
  justification: string;
  currency_code: string;
  status: string;
  version: number;
  created_at: Date | string;
  updated_at: Date | string;
  submitted_at: Date | string | null;
  cancelled_at: Date | string | null;
  cancel_reason: string | null;
};

export type SupplierPurchaseOrderLineRow = {
  id: string;
  request_line_id: string;
  line_number: number;
  description: string;
  ordered_quantity: string;
  received_quantity: string;
  unit_amount: string;
  line_amount: string;
};

export type SupplierPurchaseOrderRow = {
  id: string;
  request_id: string;
  supplier_id: string;
  unit_id: string;
  currency_code: string;
  payment_terms: string;
  status: string;
  version: number;
  issued_at: Date | string;
  updated_at: Date | string;
  cancelled_at: Date | string | null;
  cancel_reason: string | null;
};

export type GoodsReceiptRow = {
  id: string;
  supplier_purchase_order_id: string;
  status: string;
  currency_code: string;
  received_at: Date | string;
  actor_identity_id: string;
  idempotency_key: string;
  payable_id: string | null;
};

export type PurchaseRequestResponse = {
  id: string;
  unitId: string;
  requesterIdentityId: string;
  justification: string;
  currencyCode: string;
  status: string;
  version: number;
  lines: Array<{
    id: string;
    lineNumber: number;
    description: string;
    quantity: string;
    unitAmount: string;
    lineAmount: string;
  }>;
};

export type SupplierPurchaseOrderResponse = {
  id: string;
  requestId: string;
  supplierId: string;
  unitId: string;
  currencyCode: string;
  paymentTerms: string;
  status: string;
  version: number;
  lines: Array<{
    id: string;
    lineNumber: number;
    description: string;
    orderedQuantity: string;
    receivedQuantity: string;
    unitAmount: string;
    lineAmount: string;
  }>;
  receipts: Array<{
    id: string;
    payableId: string | null;
    idempotencyKey: string;
    status: string;
  }>;
};

export function toPurchaseRequestResponse(
  row: PurchaseRequestRow,
  lines: PurchaseRequestLineRow[],
): PurchaseRequestResponse {
  return {
    id: row.id,
    unitId: row.unit_id,
    requesterIdentityId: row.requester_identity_id,
    justification: row.justification,
    currencyCode: row.currency_code,
    status: row.status,
    version: row.version,
    lines: lines.map((line) => ({
      id: line.id,
      lineNumber: line.line_number,
      description: line.description,
      quantity: line.quantity,
      unitAmount: line.unit_amount,
      lineAmount: line.line_amount,
    })),
  };
}

export function toSupplierPurchaseOrderResponse(
  row: SupplierPurchaseOrderRow,
  lines: SupplierPurchaseOrderLineRow[],
  receipts: GoodsReceiptRow[],
): SupplierPurchaseOrderResponse {
  return {
    id: row.id,
    requestId: row.request_id,
    supplierId: row.supplier_id,
    unitId: row.unit_id,
    currencyCode: row.currency_code,
    paymentTerms: row.payment_terms,
    status: row.status,
    version: row.version,
    lines: lines.map((line) => ({
      id: line.id,
      lineNumber: line.line_number,
      description: line.description,
      orderedQuantity: line.ordered_quantity,
      receivedQuantity: line.received_quantity,
      unitAmount: line.unit_amount,
      lineAmount: line.line_amount,
    })),
    receipts: receipts.map((item) => ({
      id: item.id,
      payableId: item.payable_id,
      idempotencyKey: item.idempotency_key,
      status: item.status,
    })),
  };
}
