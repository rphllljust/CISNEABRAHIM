export const MEASUREMENT_STATUSES = {
  Draft: 'DRAFT',
  Submitted: 'SUBMITTED',
  UnderReview: 'UNDER_REVIEW',
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
} as const;

export type MeasurementStatus = (typeof MEASUREMENT_STATUSES)[keyof typeof MEASUREMENT_STATUSES];

export const MEASUREMENT_TRANSITIONS = {
  Submit: 'submit',
  StartReview: 'startReview',
  Approve: 'approve',
  Reject: 'reject',
} as const;

export type MeasurementTransition =
  (typeof MEASUREMENT_TRANSITIONS)[keyof typeof MEASUREMENT_TRANSITIONS];

export const MEASUREMENT_COMMANDS = {
  Submit: 'SUBMIT',
  StartReview: 'START_REVIEW',
  Approve: 'APPROVE',
  Reject: 'REJECT',
  Regenerate: 'REGENERATE',
} as const;

export type MeasurementCommandName =
  (typeof MEASUREMENT_COMMANDS)[keyof typeof MEASUREMENT_COMMANDS];

export const MEASUREMENT_HISTORY_EVENTS = {
  Created: 'CREATED',
  Regenerated: 'REGENERATED',
  ItemUpdated: 'ITEM_UPDATED',
  AdjustmentAuthorized: 'ADJUSTMENT_AUTHORIZED',
  Submitted: 'SUBMITTED',
  ReviewStarted: 'REVIEW_STARTED',
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
} as const;

export const MEASUREMENT_EDITABLE_STATUSES = new Set<MeasurementStatus>([
  MEASUREMENT_STATUSES.Draft,
]);

export const TERMINAL_MEASUREMENT_STATUSES = new Set<MeasurementStatus>([
  MEASUREMENT_STATUSES.Approved,
  MEASUREMENT_STATUSES.Rejected,
]);

export class MeasurementError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export type CommercialPricingLineSnapshot = {
  modelCode: string;
  salePrice: string | null;
  internalCost: string | null;
  currencyCode: string;
  unitCode?: string | null;
};

export type MeasurementCommercialReferenceSnapshot = {
  source: 'SERVICE_CATALOG' | 'PROPOSAL' | 'PURCHASE_ORDER';
  serviceDefinitionVersionId: string;
  capturedAt: string;
  pricingLines: CommercialPricingLineSnapshot[];
  proposalId?: string | null;
  purchaseOrderId?: string | null;
  contractReference?: string | null;
  contractSnapshot?: Record<string, unknown> | null;
  servicePeriod?: {
    startedAt: string | null;
    completedAt: string | null;
  };
};

export type MeasurementItemOrigin = {
  sourceExecutionEntryId: string;
  actualQuantity: string;
  unitCode: string;
};

export type MeasurementItemDraft = MeasurementItemOrigin & {
  measuredQuantity: string;
  unitPrice: string | null;
  lineAmount: string | null;
  pricingLineSnapshot: CommercialPricingLineSnapshot | Record<string, unknown>;
};

export type MeasurementAdjustmentInput = {
  measurementItemId: string;
  adjustmentQuantity: string;
  unitCode: string;
  reason: string;
};

export function isTerminalMeasurementStatus(status: string): boolean {
  return TERMINAL_MEASUREMENT_STATUSES.has(status as MeasurementStatus);
}

export function assertMeasurementEditable(status: string): void {
  if (!MEASUREMENT_EDITABLE_STATUSES.has(status as MeasurementStatus)) {
    throw new MeasurementError('MEASUREMENT_NOT_EDITABLE');
  }
}

export function assertServiceOrderEligibleForMeasurement(serviceOrderStatus: string): void {
  if (serviceOrderStatus !== 'COMPLETED') {
    throw new MeasurementError('SERVICE_ORDER_NOT_COMPLETED');
  }
}

export function assertCommercialReferencePresent(
  snapshot: MeasurementCommercialReferenceSnapshot | Record<string, unknown>,
): void {
  const candidate = snapshot as MeasurementCommercialReferenceSnapshot;
  if (!candidate.pricingLines || candidate.pricingLines.length === 0) {
    throw new MeasurementError('COMMERCIAL_REFERENCE_MISSING');
  }
  if (!candidate.serviceDefinitionVersionId) {
    throw new MeasurementError('COMMERCIAL_REFERENCE_MISSING');
  }
}

export function assertMeasurementHasItems(itemCount: number): void {
  if (itemCount < 1) {
    throw new MeasurementError('MEASUREMENT_ITEMS_REQUIRED');
  }
}

export function assertSeparationOfDuties(submittedBy: string | null, decidedBy: string): void {
  if (submittedBy && submittedBy === decidedBy) {
    throw new MeasurementError('SEPARATION_OF_DUTIES_VIOLATION');
  }
}
