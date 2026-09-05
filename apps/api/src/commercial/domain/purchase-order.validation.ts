import { isPositiveMoneyAmount, normalizeMoneyAmount, parseOptionalMoneyAmount } from './money';
import {
  isPurchaseOrderDocumentLinkPurpose,
  isPurchaseOrderPricingStructure,
  isPurchaseOrderRuleType,
  PURCHASE_ORDER_PRICING_STRUCTURES,
  type PurchaseOrderBillingRuleConfig,
  type PurchaseOrderContactSnapshot,
  type PurchaseOrderLocationSnapshot,
  type PurchaseOrderPricingStructure,
  type PurchaseOrderRuleType,
} from './purchase-order';

export type PurchaseOrderItemInput = {
  lineNumber: number;
  description: string;
  serviceDefinitionId?: string;
  serviceDefinitionVersionId?: string;
  quantity?: string;
  unitCode?: string;
  unitPrice?: string;
  lineTotal?: string;
  rcLineReference?: string;
};

export type PurchaseOrderBillingRuleInput = {
  ruleType: PurchaseOrderRuleType;
  ruleConfig?: PurchaseOrderBillingRuleConfig;
};

export type CreatePurchaseOrderInput = {
  clientId: string;
  unitId: string;
  poNumber: string;
  rcNumber?: string;
  issueDate?: string;
  buyerContact?: PurchaseOrderContactSnapshot;
  serviceManager?: string;
  deliveryLocation?: PurchaseOrderLocationSnapshot;
  billingLocation?: PurchaseOrderLocationSnapshot;
  currencyCode?: string;
  pricingStructure: PurchaseOrderPricingStructure;
  totalAmount?: string;
  paymentTerms?: string;
  paymentMethod?: string;
  originalDocumentId?: string;
  items?: PurchaseOrderItemInput[];
  billingRules?: PurchaseOrderBillingRuleInput[];
};

export type UpdatePurchaseOrderDraftInput = {
  rowVersion: number;
  poNumber?: string;
  rcNumber?: string | null;
  issueDate?: string | null;
  buyerContact?: PurchaseOrderContactSnapshot;
  serviceManager?: string | null;
  deliveryLocation?: PurchaseOrderLocationSnapshot;
  billingLocation?: PurchaseOrderLocationSnapshot;
  currencyCode?: string;
  pricingStructure?: PurchaseOrderPricingStructure;
  totalAmount?: string | null;
  paymentTerms?: string | null;
  paymentMethod?: string | null;
  originalDocumentId?: string | null;
  items?: PurchaseOrderItemInput[];
  billingRules?: PurchaseOrderBillingRuleInput[];
};

export type CancelPurchaseOrderInput = {
  rowVersion: number;
  cancellationReason?: string;
};

export type LinkPurchaseOrderDocumentInput = {
  documentId: string;
  linkPurpose: string;
};

export class PurchaseOrderValidationError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

function parseContact(value: PurchaseOrderContactSnapshot | undefined): PurchaseOrderContactSnapshot {
  if (!value) {
    return {};
  }
  return {
    name: value.name?.trim() || undefined,
    email: value.email?.trim() || undefined,
    phone: value.phone?.trim() || undefined,
  };
}

function parseLocation(
  value: PurchaseOrderLocationSnapshot | undefined,
): PurchaseOrderLocationSnapshot {
  if (!value) {
    return {};
  }
  return {
    label: value.label?.trim() || undefined,
    street: value.street?.trim() || undefined,
    city: value.city?.trim() || undefined,
    state: value.state?.trim() || undefined,
    postalCode: value.postalCode?.trim() || undefined,
    countryCode: value.countryCode?.trim() || undefined,
  };
}

function multiplyMoney(quantity: string, unitPrice: string): string {
  const qtyParts = quantity.split('.');
  const priceParts = unitPrice.split('.');
  const qtyWhole = BigInt(qtyParts[0] ?? '0');
  const qtyFrac = (qtyParts[1] ?? '').padEnd(4, '0').slice(0, 4);
  const priceWhole = BigInt(priceParts[0] ?? '0');
  const priceFrac = (priceParts[1] ?? '').padEnd(4, '0').slice(0, 4);
  const qtyScaled = qtyWhole * 10000n + BigInt(qtyFrac || '0');
  const priceScaled = priceWhole * 10000n + BigInt(priceFrac || '0');
  const product = qtyScaled * priceScaled;
  const whole = product / 100000000n;
  const frac = (product % 100000000n).toString().padStart(8, '0').slice(0, 4);
  return normalizeMoneyAmount(`${whole}.${frac}`);
}

function parseItems(items: PurchaseOrderItemInput[] | undefined): PurchaseOrderItemInput[] {
  if (!items || items.length === 0) {
    return [];
  }
  return items.map((item, index) => {
    const description = item.description?.trim();
    if (!description) {
      throw new PurchaseOrderValidationError('INVALID_ITEM_DESCRIPTION');
    }
    const lineNumber = item.lineNumber ?? index + 1;
    if (!Number.isInteger(lineNumber) || lineNumber < 1) {
      throw new PurchaseOrderValidationError('INVALID_LINE_NUMBER');
    }
    const quantity = item.quantity ? normalizeMoneyAmount(item.quantity) : undefined;
    if (quantity && !isPositiveMoneyAmount(quantity)) {
      throw new PurchaseOrderValidationError('INVALID_QUANTITY');
    }
    const unitPrice = parseOptionalMoneyAmount(item.unitPrice) ?? undefined;
    const lineTotal = parseOptionalMoneyAmount(item.lineTotal) ?? undefined;

    if (quantity && unitPrice && lineTotal) {
      const expected = multiplyMoney(quantity, unitPrice);
      if (expected !== lineTotal) {
        throw new PurchaseOrderValidationError('LINE_TOTAL_MISMATCH');
      }
    }

    return {
      ...item,
      lineNumber,
      description,
      quantity,
      unitPrice,
      lineTotal,
      rcLineReference: item.rcLineReference?.trim() || undefined,
      unitCode: item.unitCode?.trim().toUpperCase() || undefined,
    };
  });
}

function parseBillingRules(
  rules: PurchaseOrderBillingRuleInput[] | undefined,
): PurchaseOrderBillingRuleInput[] {
  if (!rules || rules.length === 0) {
    return [];
  }
  const seen = new Set<string>();
  return rules.map((rule) => {
    if (!isPurchaseOrderRuleType(rule.ruleType)) {
      throw new PurchaseOrderValidationError('INVALID_RULE_TYPE');
    }
    if (seen.has(rule.ruleType)) {
      throw new PurchaseOrderValidationError('DUPLICATE_RULE_TYPE');
    }
    seen.add(rule.ruleType);
    if (rule.ruleType === 'BILLING_CUTOFF') {
      const cutoffDay = rule.ruleConfig?.cutoffDay;
      if (!Number.isInteger(cutoffDay) || (cutoffDay as number) < 1 || (cutoffDay as number) > 31) {
        throw new PurchaseOrderValidationError('INVALID_BILLING_CUTOFF');
      }
    }
    if (rule.ruleType === 'RECIPIENT') {
      const recipient = rule.ruleConfig?.recipient?.trim();
      if (!recipient) {
        throw new PurchaseOrderValidationError('INVALID_RECIPIENT');
      }
    }
    return {
      ruleType: rule.ruleType,
      ruleConfig: rule.ruleConfig ?? {},
    };
  });
}

function validatePricingStructure(
  pricingStructure: PurchaseOrderPricingStructure,
  items: PurchaseOrderItemInput[],
  totalAmount: string | null,
): void {
  if (pricingStructure === PURCHASE_ORDER_PRICING_STRUCTURES.LineItems) {
    if (items.length === 0) {
      throw new PurchaseOrderValidationError('LINE_ITEMS_REQUIRED');
    }
    for (const item of items) {
      if (!item.lineTotal) {
        throw new PurchaseOrderValidationError('LINE_TOTAL_REQUIRED');
      }
    }
    return;
  }

  if (!totalAmount) {
    throw new PurchaseOrderValidationError('HEADER_TOTAL_REQUIRED');
  }
}

export function validateCreatePurchaseOrderInput(input: CreatePurchaseOrderInput): {
  pricingStructure: PurchaseOrderPricingStructure;
  currencyCode: string;
  totalAmount: string | null;
  items: PurchaseOrderItemInput[];
  billingRules: PurchaseOrderBillingRuleInput[];
  poNumber: string;
  buyerContact: PurchaseOrderContactSnapshot;
  deliveryLocation: PurchaseOrderLocationSnapshot;
  billingLocation: PurchaseOrderLocationSnapshot;
} {
  if (!isPurchaseOrderPricingStructure(input.pricingStructure)) {
    throw new PurchaseOrderValidationError('INVALID_PRICING_STRUCTURE');
  }
  const poNumber = input.poNumber?.trim();
  if (!poNumber) {
    throw new PurchaseOrderValidationError('PO_NUMBER_REQUIRED');
  }
  const currencyCode = (input.currencyCode ?? 'BRL').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currencyCode)) {
    throw new PurchaseOrderValidationError('INVALID_CURRENCY_CODE');
  }
  const items = parseItems(input.items);
  const billingRules = parseBillingRules(input.billingRules);
  const totalAmount = parseOptionalMoneyAmount(input.totalAmount);
  validatePricingStructure(input.pricingStructure, items, totalAmount);

  return {
    pricingStructure: input.pricingStructure,
    currencyCode,
    totalAmount,
    items,
    billingRules,
    poNumber,
    buyerContact: parseContact(input.buyerContact),
    deliveryLocation: parseLocation(input.deliveryLocation),
    billingLocation: parseLocation(input.billingLocation),
  };
}

export function validateUpdatePurchaseOrderDraftInput(
  input: UpdatePurchaseOrderDraftInput,
): UpdatePurchaseOrderDraftInput {
  if (!Number.isInteger(input.rowVersion) || input.rowVersion < 1) {
    throw new PurchaseOrderValidationError('INVALID_ROW_VERSION');
  }
  const items = input.items ? parseItems(input.items) : undefined;
  const billingRules = input.billingRules ? parseBillingRules(input.billingRules) : undefined;
  const pricingStructure = input.pricingStructure;
  if (pricingStructure && !isPurchaseOrderPricingStructure(pricingStructure)) {
    throw new PurchaseOrderValidationError('INVALID_PRICING_STRUCTURE');
  }
  if (pricingStructure && items) {
    validatePricingStructure(
      pricingStructure,
      items,
      parseOptionalMoneyAmount(input.totalAmount ?? undefined),
    );
  }
  return {
    ...input,
    poNumber: input.poNumber?.trim(),
    items,
    billingRules,
    buyerContact: input.buyerContact ? parseContact(input.buyerContact) : undefined,
    deliveryLocation: input.deliveryLocation
      ? parseLocation(input.deliveryLocation)
      : undefined,
    billingLocation: input.billingLocation ? parseLocation(input.billingLocation) : undefined,
    totalAmount:
      input.totalAmount === null
        ? null
        : input.totalAmount
          ? parseOptionalMoneyAmount(input.totalAmount) ?? undefined
          : undefined,
  };
}

export function validateCancelPurchaseOrderInput(
  input: CancelPurchaseOrderInput,
): CancelPurchaseOrderInput {
  if (!Number.isInteger(input.rowVersion) || input.rowVersion < 1) {
    throw new PurchaseOrderValidationError('INVALID_ROW_VERSION');
  }
  return input;
}

export function validateLinkPurchaseOrderDocumentInput(
  input: LinkPurchaseOrderDocumentInput,
): LinkPurchaseOrderDocumentInput {
  if (!input.documentId?.trim()) {
    throw new PurchaseOrderValidationError('DOCUMENT_ID_REQUIRED');
  }
  const linkPurpose = input.linkPurpose?.trim().toUpperCase();
  if (!linkPurpose || !isPurchaseOrderDocumentLinkPurpose(linkPurpose)) {
    throw new PurchaseOrderValidationError('INVALID_LINK_PURPOSE');
  }
  return {
    documentId: input.documentId.trim(),
    linkPurpose,
  };
}

export function validateRegisterPurchaseOrderInput(input: {
  rowVersion: number;
}): { rowVersion: number } {
  if (!Number.isInteger(input.rowVersion) || input.rowVersion < 1) {
    throw new PurchaseOrderValidationError('INVALID_ROW_VERSION');
  }
  return input;
}
