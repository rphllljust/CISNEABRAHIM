export type BillingOriginSnapshot = {
  capturedAt: string;
  serviceOrderId: string;
  measurementId: string | null;
  clientId: string;
  proposalId: string | null;
  purchaseOrderId: string | null;
  contractReference: string | null;
  itemCount: number;
  totalAmount: string;
  currencyCode: string;
  entitlementPolicy?: string;
};

export type BillingItemTrace = {
  measurementItemId: string | null;
  sourceExecutionEntryId: string | null;
  lineNumber: number;
  unitCode: string;
  quantity: string;
  lineAmount: string;
};

export class BillingInvariantError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export function buildBillingOriginSnapshot(input: {
  serviceOrderId: string;
  measurementId: string | null;
  clientId: string;
  proposalId: string | null;
  purchaseOrderId: string | null;
  contractReference: string | null;
  itemCount: number;
  totalAmount: string;
  currencyCode: string;
  capturedAt?: string;
  entitlementPolicy?: string;
}): BillingOriginSnapshot {
  return {
    capturedAt: input.capturedAt ?? new Date().toISOString(),
    serviceOrderId: input.serviceOrderId,
    measurementId: input.measurementId,
    clientId: input.clientId,
    proposalId: input.proposalId,
    purchaseOrderId: input.purchaseOrderId,
    contractReference: input.contractReference,
    itemCount: input.itemCount,
    totalAmount: input.totalAmount,
    currencyCode: input.currencyCode,
    entitlementPolicy: input.entitlementPolicy,
  };
}

export function assertBillingItemsTraceable(
  items: BillingItemTrace[],
  options?: { requireMeasurementOrigin?: boolean },
): void {
  if (items.length < 1) {
    throw new BillingInvariantError('BILLING_ITEMS_REQUIRED');
  }
  const requireMeasurementOrigin = options?.requireMeasurementOrigin !== false;
  for (const item of items) {
    if (requireMeasurementOrigin && !item.measurementItemId) {
      throw new BillingInvariantError('MEASUREMENT_ITEM_ORIGIN_REQUIRED');
    }
    if (!item.unitCode || !item.quantity || !item.lineAmount) {
      throw new BillingInvariantError('BILLING_ITEM_VALUES_REQUIRED');
    }
  }
}