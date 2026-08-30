import { isPurchaseOrderPricingStructure } from '../domain/purchase-order';
import type {
  CancelPurchaseOrderInput,
  CreatePurchaseOrderInput,
  LinkPurchaseOrderDocumentInput,
  PurchaseOrderBillingRuleInput,
  PurchaseOrderItemInput,
  UpdatePurchaseOrderDraftInput,
} from '../domain/purchase-order.validation';
import { assertNoPrivilegedFields } from '../../security/domain/forbidden-payload-fields';

function parseRequiredString(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== 'string') {
    throw new Error(`${key} invalid`);
  }
  return value;
}

function parseOptionalString(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new Error(`${key} invalid`);
  }
  return value;
}

function parseContact(raw: unknown): CreatePurchaseOrderInput['buyerContact'] {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const record = raw as Record<string, unknown>;
  return {
    name: parseOptionalString(record, 'name'),
    email: parseOptionalString(record, 'email'),
    phone: parseOptionalString(record, 'phone'),
  };
}

function parseLocation(raw: unknown): CreatePurchaseOrderInput['deliveryLocation'] {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const record = raw as Record<string, unknown>;
  return {
    label: parseOptionalString(record, 'label'),
    street: parseOptionalString(record, 'street'),
    city: parseOptionalString(record, 'city'),
    state: parseOptionalString(record, 'state'),
    postalCode: parseOptionalString(record, 'postalCode'),
    countryCode: parseOptionalString(record, 'countryCode'),
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
      description: parseRequiredString(record, 'description'),
      serviceDefinitionId: parseOptionalString(record, 'serviceDefinitionId'),
      serviceDefinitionVersionId: parseOptionalString(record, 'serviceDefinitionVersionId'),
      quantity: parseOptionalString(record, 'quantity'),
      unitCode: parseOptionalString(record, 'unitCode'),
      unitPrice: parseOptionalString(record, 'unitPrice'),
      lineTotal: parseOptionalString(record, 'lineTotal'),
      rcLineReference: parseOptionalString(record, 'rcLineReference'),
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
      ruleType: parseRequiredString(record, 'ruleType') as PurchaseOrderBillingRuleInput['ruleType'],
      ruleConfig:
        record['ruleConfig'] && typeof record['ruleConfig'] === 'object'
          ? (record['ruleConfig'] as Record<string, unknown>)
          : undefined,
    };
  });
}

export function parseCreatePurchaseOrderInput(body: unknown): CreatePurchaseOrderInput {
  if (!body || typeof body !== 'object') {
    throw new Error('body invalid');
  }
  const record = body as Record<string, unknown>;
  assertNoPrivilegedFields(record);
  const pricingStructure = parseRequiredString(record, 'pricingStructure');
  if (!isPurchaseOrderPricingStructure(pricingStructure)) {
    throw new Error('pricingStructure invalid');
  }
  return {
    clientId: parseRequiredString(record, 'clientId'),
    unitId: parseRequiredString(record, 'unitId'),
    poNumber: parseRequiredString(record, 'poNumber'),
    rcNumber: parseOptionalString(record, 'rcNumber'),
    issueDate: parseOptionalString(record, 'issueDate'),
    buyerContact: parseContact(record['buyerContact']),
    serviceManager: parseOptionalString(record, 'serviceManager'),
    deliveryLocation: parseLocation(record['deliveryLocation']),
    billingLocation: parseLocation(record['billingLocation']),
    currencyCode: parseOptionalString(record, 'currencyCode'),
    pricingStructure,
    totalAmount: parseOptionalString(record, 'totalAmount'),
    paymentTerms: parseOptionalString(record, 'paymentTerms'),
    paymentMethod: parseOptionalString(record, 'paymentMethod'),
    originalDocumentId: parseOptionalString(record, 'originalDocumentId'),
    items: parseItems(record['items']),
    billingRules: parseBillingRules(record['billingRules']),
  };
}

export function parseUpdatePurchaseOrderDraftInput(body: unknown): UpdatePurchaseOrderDraftInput {
  if (!body || typeof body !== 'object') {
    throw new Error('body invalid');
  }
  const record = body as Record<string, unknown>;
  assertNoPrivilegedFields(record, { allowVersion: true, allowRowVersion: true });
  const pricingStructure = parseOptionalString(record, 'pricingStructure');
  if (pricingStructure && !isPurchaseOrderPricingStructure(pricingStructure)) {
    throw new Error('pricingStructure invalid');
  }
  return {
    rowVersion: Number(record['rowVersion']),
    poNumber: parseOptionalString(record, 'poNumber'),
    rcNumber:
      record['rcNumber'] === null
        ? null
        : parseOptionalString(record, 'rcNumber'),
    issueDate:
      record['issueDate'] === null ? null : parseOptionalString(record, 'issueDate'),
    buyerContact: parseContact(record['buyerContact']),
    serviceManager:
      record['serviceManager'] === null
        ? null
        : parseOptionalString(record, 'serviceManager'),
    deliveryLocation: parseLocation(record['deliveryLocation']),
    billingLocation: parseLocation(record['billingLocation']),
    currencyCode: parseOptionalString(record, 'currencyCode'),
    pricingStructure:
      pricingStructure && isPurchaseOrderPricingStructure(pricingStructure)
        ? pricingStructure
        : undefined,
    totalAmount:
      record['totalAmount'] === null
        ? null
        : parseOptionalString(record, 'totalAmount'),
    paymentTerms:
      record['paymentTerms'] === null ? null : parseOptionalString(record, 'paymentTerms'),
    paymentMethod:
      record['paymentMethod'] === null ? null : parseOptionalString(record, 'paymentMethod'),
    originalDocumentId:
      record['originalDocumentId'] === null
        ? null
        : parseOptionalString(record, 'originalDocumentId'),
    items: parseItems(record['items']),
    billingRules: parseBillingRules(record['billingRules']),
  };
}

export function parseRowVersionBody(body: unknown): { rowVersion: number } {
  if (!body || typeof body !== 'object') {
    throw new Error('body invalid');
  }
  return { rowVersion: Number((body as Record<string, unknown>)['rowVersion']) };
}

export function parseCancelPurchaseOrderInput(body: unknown): CancelPurchaseOrderInput {
  if (!body || typeof body !== 'object') {
    throw new Error('body invalid');
  }
  const record = body as Record<string, unknown>;
  return {
    rowVersion: Number(record['rowVersion']),
    cancellationReason: parseOptionalString(record, 'cancellationReason'),
  };
}

export function parseLinkPurchaseOrderDocumentInput(body: unknown): LinkPurchaseOrderDocumentInput {
  if (!body || typeof body !== 'object') {
    throw new Error('body invalid');
  }
  const record = body as Record<string, unknown>;
  return {
    documentId: parseRequiredString(record, 'documentId'),
    linkPurpose: parseRequiredString(record, 'linkPurpose'),
  };
}

export function parseListPurchaseOrdersQuery(query: Record<string, unknown>): {
  clientId?: string;
  unitId?: string;
  limit: number;
  offset: number;
} {
  const limitRaw = Number(query['limit'] ?? 20);
  const offsetRaw = Number(query['offset'] ?? 0);
  return {
    clientId: typeof query['clientId'] === 'string' ? query['clientId'] : undefined,
    unitId: typeof query['unitId'] === 'string' ? query['unitId'] : undefined,
    limit: Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20,
    offset: Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0,
  };
}
