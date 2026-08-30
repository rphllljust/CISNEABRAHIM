export const SEARCH_ENTITY_TYPES = {
  Client: 'CLIENT',
  ServiceRequest: 'SERVICE_REQUEST',
  Proposal: 'PROPOSAL',
  PurchaseOrder: 'PURCHASE_ORDER',
  ServiceOrder: 'SERVICE_ORDER',
  Asset: 'ASSET',
  Document: 'DOCUMENT',
  Measurement: 'MEASUREMENT',
  BillingRecord: 'BILLING_RECORD',
} as const;

export type SearchEntityType = (typeof SEARCH_ENTITY_TYPES)[keyof typeof SEARCH_ENTITY_TYPES];

const ENTITY_TYPE_SET = new Set<string>(Object.values(SEARCH_ENTITY_TYPES));

export function isSearchEntityType(value: string): value is SearchEntityType {
  return ENTITY_TYPE_SET.has(value);
}

export function parseSearchEntityTypes(raw: string | undefined): SearchEntityType[] | undefined {
  if (!raw?.trim()) {
    return undefined;
  }
  const parsed = raw
    .split(',')
    .map((entry) => entry.trim().toUpperCase().replace(/-/g, '_'))
    .filter((entry) => isSearchEntityType(entry));
  return parsed.length > 0 ? parsed : undefined;
}
