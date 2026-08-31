import { formatMoneyAmountForApi } from '../domain/money';
import {
  computePurchaseOrderAvailableBalance,
  resolvePurchaseOrderAuthorizedAmount,
} from '../domain/purchase-order-balance';
import type {
  PurchaseOrderBillingRuleRow,
  PurchaseOrderDocumentLinkRow,
  PurchaseOrderItemRow,
  PurchaseOrderRow,
} from '../repositories/purchase-orders.repository.types';

export type PurchaseOrderItemResponse = {
  id: string;
  lineNumber: number;
  description: string;
  serviceDefinitionId: string | null;
  serviceDefinitionVersionId: string | null;
  serviceSnapshot: Record<string, unknown> | null;
  quantity: string | null;
  unitCode: string | null;
  unitPrice: string | null;
  lineTotal: string | null;
  rcLineReference: string | null;
};

export type PurchaseOrderBillingRuleResponse = {
  id: string;
  ruleType: string;
  ruleConfig: Record<string, unknown>;
  precedenceTier: string;
  createdAt: string;
};

export type PurchaseOrderDocumentLinkResponse = {
  id: string;
  documentId: string;
  linkPurpose: string;
  createdAt: string;
};

export type PurchaseOrderResponse = {
  id: string;
  internalCode: string;
  clientId: string;
  unitId: string;
  poNumber: string;
  rcNumber: string | null;
  issueDate: string | null;
  buyerContact: Record<string, unknown>;
  serviceManager: string | null;
  deliveryLocation: Record<string, unknown>;
  billingLocation: Record<string, unknown>;
  currencyCode: string;
  pricingStructure: string;
  totalAmount: string | null;
  paymentTerms: string | null;
  paymentMethod: string | null;
  clientSnapshot: Record<string, unknown> | null;
  originalDocumentId: string | null;
  status: string;
  registeredAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseOrderBalanceResponse = {
  authorizedAmount: string;
  consumedAmount: string;
  availableBalance: string;
};

export type PurchaseOrderDetailResponse = {
  purchaseOrder: PurchaseOrderResponse;
  items: PurchaseOrderItemResponse[];
  billingRules: PurchaseOrderBillingRuleResponse[];
  documentLinks: PurchaseOrderDocumentLinkResponse[];
  balance: PurchaseOrderBalanceResponse;
};

function toItemResponse(row: PurchaseOrderItemRow): PurchaseOrderItemResponse {
  return {
    id: row.id,
    lineNumber: row.line_number,
    description: row.description,
    serviceDefinitionId: row.service_definition_id,
    serviceDefinitionVersionId: row.service_definition_version_id,
    serviceSnapshot: row.service_snapshot,
    quantity: formatMoneyAmountForApi(row.quantity),
    unitCode: row.unit_code,
    unitPrice: formatMoneyAmountForApi(row.unit_price_amount),
    lineTotal: formatMoneyAmountForApi(row.line_total_amount),
    rcLineReference: row.rc_line_reference,
  };
}

function toRuleResponse(row: PurchaseOrderBillingRuleRow): PurchaseOrderBillingRuleResponse {
  return {
    id: row.id,
    ruleType: row.rule_type,
    ruleConfig: row.rule_config,
    precedenceTier: row.precedence_tier,
    createdAt: row.created_at,
  };
}

function toDocumentLinkResponse(row: PurchaseOrderDocumentLinkRow): PurchaseOrderDocumentLinkResponse {
  return {
    id: row.id,
    documentId: row.document_id,
    linkPurpose: row.link_purpose,
    createdAt: row.created_at,
  };
}

export function toPurchaseOrderResponse(row: PurchaseOrderRow): PurchaseOrderResponse {
  return {
    id: row.id,
    internalCode: row.internal_code,
    clientId: row.client_id,
    unitId: row.unit_id,
    poNumber: row.po_number,
    rcNumber: row.rc_number,
    issueDate: row.issue_date,
    buyerContact: row.buyer_contact,
    serviceManager: row.service_manager,
    deliveryLocation: row.delivery_location,
    billingLocation: row.billing_location,
    currencyCode: row.currency_code,
    pricingStructure: row.pricing_structure,
    totalAmount: formatMoneyAmountForApi(row.total_amount),
    paymentTerms: row.payment_terms,
    paymentMethod: row.payment_method,
    clientSnapshot: row.client_snapshot,
    originalDocumentId: row.original_document_id,
    status: row.status,
    registeredAt: row.registered_at,
    cancelledAt: row.cancelled_at,
    cancellationReason: row.cancellation_reason,
    rowVersion: row.row_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toBalanceResponse(
  purchaseOrder: PurchaseOrderRow,
  items: PurchaseOrderItemRow[],
): PurchaseOrderBalanceResponse {
  const source = {
    pricingStructure: purchaseOrder.pricing_structure,
    totalAmount: purchaseOrder.total_amount,
    lineTotals: items.map((item) => item.line_total_amount),
    consumedAmount: purchaseOrder.consumed_amount,
  };
  return {
    authorizedAmount: formatMoneyAmountForApi(resolvePurchaseOrderAuthorizedAmount(source))!,
    consumedAmount: formatMoneyAmountForApi(purchaseOrder.consumed_amount)!,
    availableBalance: formatMoneyAmountForApi(computePurchaseOrderAvailableBalance(source))!,
  };
}

export function toPurchaseOrderDetailResponse(
  purchaseOrder: PurchaseOrderRow,
  items: PurchaseOrderItemRow[],
  billingRules: PurchaseOrderBillingRuleRow[],
  documentLinks: PurchaseOrderDocumentLinkRow[],
): PurchaseOrderDetailResponse {
  return {
    purchaseOrder: toPurchaseOrderResponse(purchaseOrder),
    items: items.map(toItemResponse),
    billingRules: billingRules.map(toRuleResponse),
    documentLinks: documentLinks.map(toDocumentLinkResponse),
    balance: toBalanceResponse(purchaseOrder, items),
  };
}
