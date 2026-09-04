export const BILLING_ENTITLEMENT_POLICIES = {
  MeasurementApproved: 'MEASUREMENT_APPROVED',
  FixedPrice: 'FIXED_PRICE',
  Periodic: 'PERIODIC',
  Milestone: 'MILESTONE',
} as const;

export type BillingEntitlementPolicy =
  (typeof BILLING_ENTITLEMENT_POLICIES)[keyof typeof BILLING_ENTITLEMENT_POLICIES];

export const PURCHASE_ORDER_REQUIREMENTS = {
  NotRequired: 'NOT_REQUIRED',
  BeforeExecution: 'BEFORE_EXECUTION',
  BeforeBilling: 'BEFORE_BILLING',
} as const;

export type PurchaseOrderRequirement =
  (typeof PURCHASE_ORDER_REQUIREMENTS)[keyof typeof PURCHASE_ORDER_REQUIREMENTS];

export class BillingEntitlementError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export function resolveBillingEntitlementPolicy(
  serviceSnapshot: Record<string, unknown> | null | undefined,
): BillingEntitlementPolicy {
  const value = serviceSnapshot?.['billingEntitlementPolicy'];
  if (
    value === BILLING_ENTITLEMENT_POLICIES.FixedPrice ||
    value === BILLING_ENTITLEMENT_POLICIES.Periodic ||
    value === BILLING_ENTITLEMENT_POLICIES.Milestone
  ) {
    return value;
  }
  return BILLING_ENTITLEMENT_POLICIES.MeasurementApproved;
}

export function requiresApprovedMeasurement(policy: BillingEntitlementPolicy): boolean {
  return policy === BILLING_ENTITLEMENT_POLICIES.MeasurementApproved;
}

export type ContractualBillingLine = {
  unitCode: string;
  quantity: string;
  unitPrice: string;
  lineAmount: string;
  currencyCode: string;
  lineLabel: string;
};

export function resolveContractualBillingLine(input: {
  policy?: BillingEntitlementPolicy;
  serviceSnapshot: Record<string, unknown> | null | undefined;
  proposalSnapshot: Record<string, unknown> | null | undefined;
  purchaseOrderSnapshot: Record<string, unknown> | null | undefined;
}): ContractualBillingLine {
  const policy = input.policy ?? BILLING_ENTITLEMENT_POLICIES.FixedPrice;

  let amountCandidate: string | null = null;
  if (policy === BILLING_ENTITLEMENT_POLICIES.Periodic) {
    amountCandidate =
      (typeof input.serviceSnapshot?.['periodicAmount'] === 'string'
        ? input.serviceSnapshot['periodicAmount']
        : null) ??
      (typeof input.proposalSnapshot?.['periodicAmount'] === 'string'
        ? input.proposalSnapshot['periodicAmount']
        : null) ??
      (typeof input.purchaseOrderSnapshot?.['periodicAmount'] === 'string'
        ? input.purchaseOrderSnapshot['periodicAmount']
        : null);
  } else if (policy === BILLING_ENTITLEMENT_POLICIES.Milestone) {
    amountCandidate =
      (typeof input.serviceSnapshot?.['milestoneAmount'] === 'string'
        ? input.serviceSnapshot['milestoneAmount']
        : null) ??
      (typeof input.proposalSnapshot?.['milestoneAmount'] === 'string'
        ? input.proposalSnapshot['milestoneAmount']
        : null) ??
      (typeof input.purchaseOrderSnapshot?.['milestoneAmount'] === 'string'
        ? input.purchaseOrderSnapshot['milestoneAmount']
        : null);
  } else {
    amountCandidate =
      (typeof input.proposalSnapshot?.['globalSalePrice'] === 'string'
        ? input.proposalSnapshot['globalSalePrice']
        : null) ??
      (typeof input.purchaseOrderSnapshot?.['totalAmount'] === 'string'
        ? input.purchaseOrderSnapshot['totalAmount']
        : null);
  }

  if (!amountCandidate) {
    // PERIODIC/MILESTONE exigem base por período/marco; jamais cobram o
    // contrato inteiro silenciosamente.
    throw new BillingEntitlementError('BILLING_ITEMS_REQUIRED');
  }
  const measurementModel = input.serviceSnapshot?.['measurementModel'] as
    | { defaultUnitCode?: string | null }
    | undefined;
  const unitCode =
    (typeof measurementModel?.defaultUnitCode === 'string' && measurementModel.defaultUnitCode.trim().length > 0
      ? measurementModel.defaultUnitCode
      : null) ?? 'SERVICE';
  const currencyCode =
    (typeof input.proposalSnapshot?.['currencyCode'] === 'string'
      ? input.proposalSnapshot['currencyCode']
      : null) ??
    (typeof input.purchaseOrderSnapshot?.['currencyCode'] === 'string'
      ? input.purchaseOrderSnapshot['currencyCode']
      : null) ??
    'BRL';
  return {
    unitCode,
    quantity: '1',
    unitPrice: amountCandidate,
    lineAmount: amountCandidate,
    currencyCode,
    lineLabel: 'Faturamento contratual',
  };
}

export function assertBillingRight(input: {
  policy: BillingEntitlementPolicy;
  serviceOrderStatus: string;
  measurementStatus?: string | null;
}): void {
  if (input.serviceOrderStatus === 'CANCELLED') {
    throw new BillingEntitlementError('INVALID_STATE');
  }
  if (requiresApprovedMeasurement(input.policy)) {
    if (input.measurementStatus !== 'APPROVED') {
      throw new BillingEntitlementError('MEASUREMENT_NOT_APPROVED');
    }
    return;
  }
  if (input.serviceOrderStatus !== 'COMPLETED' && input.serviceOrderStatus !== 'IN_EXECUTION') {
    throw new BillingEntitlementError('SERVICE_NOT_BILLABLE_YET');
  }
}

export function assertPurchaseOrderRequirement(input: {
  requirement: string | null | undefined;
  phase: 'EXECUTION' | 'BILLING';
  purchaseOrderId: string | null | undefined;
  catalogRequiresPurchaseOrder?: boolean;
}): void {
  const required =
    input.catalogRequiresPurchaseOrder === true ||
    (input.phase === 'EXECUTION' && input.requirement === PURCHASE_ORDER_REQUIREMENTS.BeforeExecution) ||
    (input.phase === 'BILLING' &&
      (input.requirement === PURCHASE_ORDER_REQUIREMENTS.BeforeExecution ||
        input.requirement === PURCHASE_ORDER_REQUIREMENTS.BeforeBilling));
  if (required && !input.purchaseOrderId) {
    throw new BillingEntitlementError('PURCHASE_ORDER_REQUIRED');
  }
}
