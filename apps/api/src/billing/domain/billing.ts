export const BILLING_RECORD_STATUSES = {
  Prepared: 'PREPARED',
  Voided: 'VOIDED',
} as const;

export type BillingRecordStatus =
  (typeof BILLING_RECORD_STATUSES)[keyof typeof BILLING_RECORD_STATUSES];

export const PAYMENT_TERMS_SOURCES = {
  PurchaseOrder: 'PURCHASE_ORDER',
  ProposalSnapshot: 'PROPOSAL_SNAPSHOT',
  ContractSnapshot: 'CONTRACT_SNAPSHOT',
  Declared: 'DECLARED',
} as const;

export type PaymentTermsSource =
  (typeof PAYMENT_TERMS_SOURCES)[keyof typeof PAYMENT_TERMS_SOURCES];

export const BILLING_COMMANDS = {
  Prepare: 'PREPARE',
  Void: 'VOID',
} as const;

export type BillingCommandName = (typeof BILLING_COMMANDS)[keyof typeof BILLING_COMMANDS];

export const BILLING_HISTORY_EVENTS = {
  Prepared: 'PREPARED',
  Voided: 'VOIDED',
} as const;

export class BillingError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export type BillingAddressSnapshot = {
  purpose?: string;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
};

export type BillingItemDraft = {
  measurementItemId: string;
  sourceExecutionEntryId: string | null;
  lineNumber: number;
  unitCode: string;
  quantity: string;
  unitPrice: string | null;
  lineAmount: string;
  pricingLineSnapshot: Record<string, unknown>;
  lineLabel: string;
};

export function assertMeasurementApprovedForBilling(measurementStatus: string): void {
  if (measurementStatus !== 'APPROVED') {
    throw new BillingError('MEASUREMENT_NOT_APPROVED');
  }
}

export function assertBillingRecordPrepared(status: string): void {
  if (status !== BILLING_RECORD_STATUSES.Prepared) {
    throw new BillingError('BILLING_INVALID_STATE');
  }
}

export function assertBillingItemsPresent(count: number): void {
  if (count < 1) {
    throw new BillingError('BILLING_ITEMS_REQUIRED');
  }
}
