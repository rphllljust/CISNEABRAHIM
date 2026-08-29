export const PURCHASE_ORDER_STATUSES = {
  Draft: 'DRAFT',
  Registered: 'REGISTERED',
  Cancelled: 'CANCELLED',
} as const;

export type PurchaseOrderStatus =
  (typeof PURCHASE_ORDER_STATUSES)[keyof typeof PURCHASE_ORDER_STATUSES];

export const PURCHASE_ORDER_PRICING_STRUCTURES = {
  LineItems: 'LINE_ITEMS',
  HeaderTotal: 'HEADER_TOTAL',
} as const;

export type PurchaseOrderPricingStructure =
  (typeof PURCHASE_ORDER_PRICING_STRUCTURES)[keyof typeof PURCHASE_ORDER_PRICING_STRUCTURES];

export const PURCHASE_ORDER_RULE_TYPES = {
  PoNumberRequiredOnInvoice: 'PO_NUMBER_REQUIRED_ON_INVOICE',
  XmlRequired: 'XML_REQUIRED',
  PdfRequired: 'PDF_REQUIRED',
  BillingCutoff: 'BILLING_CUTOFF',
  Recipient: 'RECIPIENT',
} as const;

export type PurchaseOrderRuleType =
  (typeof PURCHASE_ORDER_RULE_TYPES)[keyof typeof PURCHASE_ORDER_RULE_TYPES];

/**
 * Tiers for future precedence resolution (PO > Contract > Client > System Default).
 * Resolution is NOT implemented — rules are stored and returned per purchase order only.
 */
export const COMMERCIAL_RULE_PRECEDENCE_TIERS = {
  PurchaseOrder: 'PURCHASE_ORDER',
} as const;

export type CommercialRulePrecedenceTier =
  (typeof COMMERCIAL_RULE_PRECEDENCE_TIERS)[keyof typeof COMMERCIAL_RULE_PRECEDENCE_TIERS];

export const PURCHASE_ORDER_DOCUMENT_LINK_PURPOSES = {
  Original: 'ORIGINAL',
  XmlAttachment: 'XML_ATTACHMENT',
  PdfAttachment: 'PDF_ATTACHMENT',
  Supporting: 'SUPPORTING',
} as const;

export type PurchaseOrderDocumentLinkPurpose =
  (typeof PURCHASE_ORDER_DOCUMENT_LINK_PURPOSES)[keyof typeof PURCHASE_ORDER_DOCUMENT_LINK_PURPOSES];

const STATUS_SET = new Set<string>(Object.values(PURCHASE_ORDER_STATUSES));
const PRICING_SET = new Set<string>(Object.values(PURCHASE_ORDER_PRICING_STRUCTURES));
const RULE_TYPE_SET = new Set<string>(Object.values(PURCHASE_ORDER_RULE_TYPES));
const LINK_PURPOSE_SET = new Set<string>(Object.values(PURCHASE_ORDER_DOCUMENT_LINK_PURPOSES));

export function isPurchaseOrderStatus(value: string): value is PurchaseOrderStatus {
  return STATUS_SET.has(value);
}

export function isPurchaseOrderPricingStructure(
  value: string,
): value is PurchaseOrderPricingStructure {
  return PRICING_SET.has(value);
}

export function isPurchaseOrderRuleType(value: string): value is PurchaseOrderRuleType {
  return RULE_TYPE_SET.has(value);
}

export function isPurchaseOrderDocumentLinkPurpose(
  value: string,
): value is PurchaseOrderDocumentLinkPurpose {
  return LINK_PURPOSE_SET.has(value);
}

export type PurchaseOrderContactSnapshot = {
  name?: string;
  email?: string;
  phone?: string;
};

export type PurchaseOrderLocationSnapshot = {
  label?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryCode?: string;
};

export type PurchaseOrderBillingRuleConfig = {
  cutoffDay?: number;
  recipient?: string;
  [key: string]: unknown;
};
