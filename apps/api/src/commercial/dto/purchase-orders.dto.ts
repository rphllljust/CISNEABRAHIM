import { isPurchaseOrderPricingStructure } from '../domain/purchase-order';
import type {
  CancelPurchaseOrderInput,
  CreatePurchaseOrderInput,
  LinkPurchaseOrderDocumentInput,
  PurchaseOrderBillingRuleInput,
  PurchaseOrderItemInput,
  UpdatePurchaseOrderDraftInput,
} from '../domain/purchase-order.validation';
import {
  assertRecordBody,
  parseCommercialEntityListQuery,
  parseLenientRowVersionBody,
  parseLinkDocumentInput,
  parseOptionalStringField,
  parseRequiredStringField,
} from '../../infrastructure/http/contracts';
import { assertNoPrivilegedFields } from '../../security/domain/forbidden-payload-fields';

function parseContact(raw: unknown): CreatePurchaseOrderInput['buyerContact'] {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const record = raw as Record<string, unknown>;
  return {
    name: parseOptionalStringField(record, 'name'),
    email: parseOptionalStringField(record, 'email'),
    phone: parseOptionalStringField(record, 'phone'),
  };
}

function parseLocation(raw: unknown): CreatePurchaseOrderInput['deliveryLocation'] {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const record = raw as Record<string, unknown>;
  return {
    label: parseOptionalStringField(record, 'label'),
    street: parseOptionalStringField(record, 'street'),
    city: parseOptionalStringField(record, 'city'),
    state: parseOptionalStringField(record, 'state'),
    postalCode: parseOptionalStringField(record, 'postalCode'),
    countryCode: parseOptionalStringField(record, 'countryCode'),
  };
}

function parseItems(raw: unknown): PurchaseOrderItemInput[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }
  return raw.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error('items invalid');
    }
    const record = item as Record<string, unknown>;
    return {
      lineNumber: Number(record['lineNumber'] ?? index + 1),
      description: parseRequiredStringField(record, 'description'),
      serviceDefinitionId: parseOptionalStringField(record, 'serviceDefinitionId'),
      serviceDefinitionVersionId: parseOptionalStringField(record, 'serviceDefinitionVersionId'),
      quantity: parseOptionalStringField(record, 'quantity'),
      unitCode: parseOptionalStringField(record, 'unitCode'),
      unitPrice: parseOptionalStringField(record, 'unitPrice'),
      lineTotal: parseOptionalStringField(record, 'lineTotal'),
      rcLineReference: parseOptionalStringField(record, 'rcLineReference'),
    };
  });
}

function parseBillingRules(raw: unknown): PurchaseOrderBillingRuleInput[] | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }
  return raw.map((rule) => {
    if (!rule || typeof rule !== 'object') {
      throw new Error('billingRules invalid');
    }
    const record = rule as Record<string, unknown>;
    return {
      ruleType: parseRequiredStringField(record, 'ruleType') as PurchaseOrderBillingRuleInput['ruleType'],
      ruleConfig:
        record['ruleConfig'] && typeof record['ruleConfig'] === 'object'
          ? (record['ruleConfig'] as Record<string, unknown>)
          : undefined,
    };
  });
}

export function parseCreatePurchaseOrderInput(body: unknown): CreatePurchaseOrderInput {
  const record = assertRecordBody(body);
  assertNoPrivilegedFields(record);
  const pricingStructure = parseRequiredStringField(record, 'pricingStructure');
  if (!isPurchaseOrderPricingStructure(pricingStructure)) {
    throw new Error('pricingStructure invalid');
  }
  return {
    clientId: parseRequiredStringField(record, 'clientId'),
    unitId: parseRequiredStringField(record, 'unitId'),
    poNumber: parseRequiredStringField(record, 'poNumber'),
    rcNumber: parseOptionalStringField(record, 'rcNumber'),
    issueDate: parseOptionalStringField(record, 'issueDate'),
    buyerContact: parseContact(record['buyerContact']),
    serviceManager: parseOptionalStringField(record, 'serviceManager'),
    deliveryLocation: parseLocation(record['deliveryLocation']),
    billingLocation: parseLocation(record['billingLocation']),
    currencyCode: parseOptionalStringField(record, 'currencyCode'),
    pricingStructure,
    totalAmount: parseOptionalStringField(record, 'totalAmount'),
    paymentTerms: parseOptionalStringField(record, 'paymentTerms'),
    paymentMethod: parseOptionalStringField(record, 'paymentMethod'),
    originalDocumentId: parseOptionalStringField(record, 'originalDocumentId'),
    items: parseItems(record['items']),
    billingRules: parseBillingRules(record['billingRules']),
  };
}

export function parseUpdatePurchaseOrderDraftInput(body: unknown): UpdatePurchaseOrderDraftInput {
  const record = assertRecordBody(body);
  assertNoPrivilegedFields(record, { allowVersion: true, allowRowVersion: true });
  const pricingStructure = parseOptionalStringField(record, 'pricingStructure');
  if (pricingStructure && !isPurchaseOrderPricingStructure(pricingStructure)) {
    throw new Error('pricingStructure invalid');
  }
  return {
    rowVersion: Number(record['rowVersion']),
    poNumber: parseOptionalStringField(record, 'poNumber'),
    rcNumber:
      record['rcNumber'] === null
        ? null
        : parseOptionalStringField(record, 'rcNumber'),
    issueDate:
      record['issueDate'] === null ? null : parseOptionalStringField(record, 'issueDate'),
    buyerContact: parseContact(record['buyerContact']),
    serviceManager:
      record['serviceManager'] === null
        ? null
        : parseOptionalStringField(record, 'serviceManager'),
    deliveryLocation: parseLocation(record['deliveryLocation']),
    billingLocation: parseLocation(record['billingLocation']),
    currencyCode: parseOptionalStringField(record, 'currencyCode'),
    pricingStructure:
      pricingStructure && isPurchaseOrderPricingStructure(pricingStructure)
        ? pricingStructure
        : undefined,
    totalAmount:
      record['totalAmount'] === null
        ? null
        : parseOptionalStringField(record, 'totalAmount'),
    paymentTerms:
      record['paymentTerms'] === null ? null : parseOptionalStringField(record, 'paymentTerms'),
    paymentMethod:
      record['paymentMethod'] === null ? null : parseOptionalStringField(record, 'paymentMethod'),
    originalDocumentId:
      record['originalDocumentId'] === null
        ? null
        : parseOptionalStringField(record, 'originalDocumentId'),
    items: parseItems(record['items']),
    billingRules: parseBillingRules(record['billingRules']),
  };
}

export function parseRowVersionBody(body: unknown): { rowVersion: number } {
  return parseLenientRowVersionBody(body);
}

export function parseCancelPurchaseOrderInput(body: unknown): CancelPurchaseOrderInput {
  const record = assertRecordBody(body);
  return {
    rowVersion: Number(record['rowVersion']),
    cancellationReason: parseOptionalStringField(record, 'cancellationReason'),
  };
}

export function parseLinkPurchaseOrderDocumentInput(
  body: unknown,
): LinkPurchaseOrderDocumentInput {
  return parseLinkDocumentInput(body);
}

export function parseListPurchaseOrdersQuery(query: Record<string, unknown>) {
  return parseCommercialEntityListQuery(query);
}
