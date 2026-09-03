import { formatMoneyAmountForApi } from './money';
import type {
  PurchaseOrderItemRow,
  PurchaseOrderRow,
} from '../repositories/purchase-orders.repository.types';

export type PurchaseOrderItemCommercialSnapshot = {
  description: string;
  unitCode: string | null;
  quantity: string | null;
  unitPrice: string | null;
  lineTotal: string | null;
  rcLineReference: string | null;
  snapshottedAt: string;
};

export type PurchaseOrderCommercialSnapshot = {
  poNumber: string;
  rcNumber: string | null;
  issueDate: string | null;
  paymentTerms: string | null;
  paymentMethod: string | null;
  currencyCode: string;
  pricingStructure: string;
  totalAmount: string | null;
  buyerContact: Record<string, unknown>;
  serviceManager: string | null;
  deliveryLocation: Record<string, unknown>;
  billingLocation: Record<string, unknown>;
  snapshottedAt: string;
};

export function buildPurchaseOrderItemCommercialSnapshot(
  item: Pick<
    PurchaseOrderItemRow,
    | 'description'
    | 'unit_code'
    | 'quantity'
    | 'unit_price_amount'
    | 'line_total_amount'
    | 'rc_line_reference'
  >,
  snapshottedAt: string,
): PurchaseOrderItemCommercialSnapshot {
  return {
    description: item.description,
    unitCode: item.unit_code,
    quantity: formatMoneyAmountForApi(item.quantity),
    unitPrice: formatMoneyAmountForApi(item.unit_price_amount),
    lineTotal: formatMoneyAmountForApi(item.line_total_amount),
    rcLineReference: item.rc_line_reference,
    snapshottedAt,
  };
}

export function buildPurchaseOrderCommercialSnapshot(
  purchaseOrder: PurchaseOrderRow,
  snapshottedAt: string,
): PurchaseOrderCommercialSnapshot {
  return {
    poNumber: purchaseOrder.po_number,
    rcNumber: purchaseOrder.rc_number,
    issueDate: purchaseOrder.issue_date,
    paymentTerms: purchaseOrder.payment_terms,
    paymentMethod: purchaseOrder.payment_method,
    currencyCode: purchaseOrder.currency_code,
    pricingStructure: purchaseOrder.pricing_structure,
    totalAmount: formatMoneyAmountForApi(purchaseOrder.total_amount),
    buyerContact: purchaseOrder.buyer_contact,
    serviceManager: purchaseOrder.service_manager,
    deliveryLocation: purchaseOrder.delivery_location,
    billingLocation: purchaseOrder.billing_location,
    snapshottedAt,
  };
}

export function resolvePurchaseOrderItemFields(
  row: PurchaseOrderItemRow,
): Omit<PurchaseOrderItemCommercialSnapshot, 'snapshottedAt'> {
  const snapshot = row.commercial_snapshot as PurchaseOrderItemCommercialSnapshot | null;
  if (snapshot) {
    return {
      description: snapshot.description,
      unitCode: snapshot.unitCode,
      quantity: snapshot.quantity,
      unitPrice: snapshot.unitPrice,
      lineTotal: snapshot.lineTotal,
      rcLineReference: snapshot.rcLineReference,
    };
  }

  return {
    description: row.description,
    unitCode: row.unit_code,
    quantity: formatMoneyAmountForApi(row.quantity),
    unitPrice: formatMoneyAmountForApi(row.unit_price_amount),
    lineTotal: formatMoneyAmountForApi(row.line_total_amount),
    rcLineReference: row.rc_line_reference,
  };
}

export function resolvePurchaseOrderCommercialFields(
  row: PurchaseOrderRow,
): Omit<PurchaseOrderCommercialSnapshot, 'snapshottedAt'> {
  const snapshot = row.commercial_snapshot as PurchaseOrderCommercialSnapshot | null;
  if (snapshot) {
    return {
      poNumber: snapshot.poNumber,
      rcNumber: snapshot.rcNumber,
      issueDate: snapshot.issueDate,
      paymentTerms: snapshot.paymentTerms,
      paymentMethod: snapshot.paymentMethod,
      currencyCode: snapshot.currencyCode,
      pricingStructure: snapshot.pricingStructure,
      totalAmount: snapshot.totalAmount,
      buyerContact: snapshot.buyerContact,
      serviceManager: snapshot.serviceManager,
      deliveryLocation: snapshot.deliveryLocation,
      billingLocation: snapshot.billingLocation,
    };
  }

  return {
    poNumber: row.po_number,
    rcNumber: row.rc_number,
    issueDate: row.issue_date,
    paymentTerms: row.payment_terms,
    paymentMethod: row.payment_method,
    currencyCode: row.currency_code,
    pricingStructure: row.pricing_structure,
    totalAmount: formatMoneyAmountForApi(row.total_amount),
    buyerContact: row.buyer_contact,
    serviceManager: row.service_manager,
    deliveryLocation: row.delivery_location,
    billingLocation: row.billing_location,
  };
}
