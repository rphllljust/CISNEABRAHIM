import { BILLING_RECORD_STATUSES, BillingError } from './billing';

export const BILLING_DOCUMENT_STATUSES = {
  Finalized: 'FINALIZED',
  Cancelled: 'CANCELLED',
} as const;

export type BillingDocumentStatus =
  (typeof BILLING_DOCUMENT_STATUSES)[keyof typeof BILLING_DOCUMENT_STATUSES];

export const BILLING_DOCUMENT_COMMANDS = {
  Issue: 'ISSUE',
  Cancel: 'CANCEL',
  Replace: 'REPLACE',
} as const;

export type BillingDocumentCommandName =
  (typeof BILLING_DOCUMENT_COMMANDS)[keyof typeof BILLING_DOCUMENT_COMMANDS];

export const BILLING_DOCUMENT_HISTORY_EVENTS = {
  Issued: 'ISSUED',
  Cancelled: 'CANCELLED',
  Replaced: 'REPLACED',
} as const;

export const BILLING_DOCUMENT_NUMBER_PREFIX = 'NF';

export type BillingDocumentItemSnapshot = {
  lineNumber: number;
  billingItemId: string | null;
  measurementItemId: string | null;
  unitCode: string;
  quantity: string;
  unitPrice: string | null;
  lineAmount: string;
  lineLabel: string;
  pricingLineSnapshot: Record<string, unknown>;
};

export type BillingDocumentPdfSnapshot = {
  documentNumber: string;
  documentCategory: string;
  fiscalDisclaimer: string;
  issuedAt: string;
  dueDate: string | null;
  emitterLegalName: string;
  emitterTaxId: string;
  emitterAddress: Record<string, unknown>;
  clientLegalName: string;
  clientTaxId: string | null;
  billingAddress: Record<string, unknown>;
  paymentTerms: string;
  currencyCode: string;
  totalAmount: string;
  purchaseOrderNumber: string | null;
  contractReference: string | null;
  commercialReference: Record<string, unknown>;
  items: BillingDocumentItemSnapshot[];
};

export function formatBillingDocumentNumber(year: number, sequenceNumber: number): string {
  const padded = String(sequenceNumber).padStart(6, '0');
  return `${BILLING_DOCUMENT_NUMBER_PREFIX}-${year}-${padded}`;
}

export function assertBillingRecordIssuable(status: string): void {
  if (status !== BILLING_RECORD_STATUSES.Prepared) {
    throw new BillingError('BILLING_INVALID_STATE');
  }
}

export function assertBillingDocumentFinalized(status: string): void {
  if (status !== BILLING_DOCUMENT_STATUSES.Finalized) {
    throw new BillingError('BILLING_DOCUMENT_INVALID_STATE');
  }
}

export function assertBillingDocumentCancellable(status: string): void {
  if (status !== BILLING_DOCUMENT_STATUSES.Finalized) {
    throw new BillingError('BILLING_DOCUMENT_INVALID_STATE');
  }
}

export function assertBillingDocumentImmutable(status: string): void {
  if (status === BILLING_DOCUMENT_STATUSES.Finalized) {
    throw new BillingError('BILLING_DOCUMENT_IMMUTABLE');
  }
}
