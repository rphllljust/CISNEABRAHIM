/**
 * Future cross-domain event payload contracts (v1).
 *
 * NOT registered in DOMAIN_EVENT_TYPES - no publisher or consumer yet.
 * When a module is implemented, add the type to domain-event-type.ts and wire outbox.
 *
 * Flow (future):
 *   MeasurementApproved -> Billing (implemented)
 *   BillingFinalized -> Finance
 *   FiscalDocumentAuthorized -> Finance / Accounting
 *   PaymentSettled -> Finance / Accounting
 *   InventoryMovementPosted -> Accounting
 *   PayrollClosed -> Accounting
 */
import { DOMAIN_EVENT_PAYLOAD_VERSION } from './domain-event-type';

type FuturePayloadBase = {
  schemaVersion: typeof DOMAIN_EVENT_PAYLOAD_VERSION;
  /** Marker - payloads with this contract are not yet published. */
  contractStatus: 'NOT_YET_PUBLISHED';
};

/** Billing preparation complete; triggers receivable creation in FINANCE (future). */
export type BillingFinalizedPayloadV1 = FuturePayloadBase & {
  billingRecordId: string;
  billingDocumentId: string | null;
  serviceOrderId: string;
  measurementId: string;
  unitId: string;
  totalAmount: string;
  currencyCode: string;
  finalizedAt: string;
};

/** Official fiscal document authorized; triggers finance/accounting (future). */
export type FiscalDocumentAuthorizedPayloadV1 = FuturePayloadBase & {
  fiscalDocumentId: string;
  billingRecordId: string | null;
  unitId: string;
  authorizedAt: string;
};

/** Official fiscal document cancelled; triggers accounting reversal (future emit). */
export type FiscalDocumentCancelledPayloadV1 = FuturePayloadBase & {
  fiscalDocumentId: string;
  unitId: string;
  cancelledAt: string;
};

/** Tax calculation persisted; triggers accounting when a posting rule exists (future emit). */
export type TaxCalculationConfirmedPayloadV1 = FuturePayloadBase & {
  taxCalculationId: string;
  unitId: string;
  resultAmount: string;
  currencyCode: string;
  confirmedAt: string;
};

/** Payment settlement recorded; triggers accounting posting (future). */
export type PaymentSettledPayloadV1 = FuturePayloadBase & {
  settlementId: string;
  receivableId: string | null;
  payableId: string | null;
  unitId: string;
  settledAmount: string;
  currencyCode: string;
  settledAt: string;
};

/** Stock movement posted; triggers accounting (future). */
export type InventoryMovementPostedPayloadV1 = FuturePayloadBase & {
  stockMovementId: string;
  warehouseId: string;
  inventoryItemId: string;
  unitId: string;
  postedAt: string;
};

/** Payroll period closed; triggers accounting (future). */
export type PayrollClosedPayloadV1 = FuturePayloadBase & {
  payrollPeriodId: string;
  unitId: string;
  closedAt: string;
};

export type FutureCrossDomainEventPayloadV1 =
  | BillingFinalizedPayloadV1
  | FiscalDocumentAuthorizedPayloadV1
  | FiscalDocumentCancelledPayloadV1
  | TaxCalculationConfirmedPayloadV1
  | PaymentSettledPayloadV1
  | InventoryMovementPostedPayloadV1
  | PayrollClosedPayloadV1;

/** Event type strings reserved for future registration - do not emit yet. */
export const FUTURE_CROSS_DOMAIN_EVENT_TYPES = {
  BillingFinalized: 'BILLING_FINALIZED',
  ReceivableRecognized: 'RECEIVABLE_RECOGNIZED',
  SettlementConfirmed: 'SETTLEMENT_CONFIRMED',
  PayableRecognized: 'PAYABLE_RECOGNIZED',
  PaymentConfirmed: 'PAYMENT_CONFIRMED',
  FiscalDocumentAuthorized: 'FISCAL_DOCUMENT_AUTHORIZED',
  FiscalDocumentCancelled: 'FISCAL_DOCUMENT_CANCELLED',
  TaxCalculationConfirmed: 'TAX_CALCULATION_CONFIRMED',
  PaymentSettled: 'PAYMENT_SETTLED',
  InventoryMovementPosted: 'INVENTORY_MOVEMENT_POSTED',
  PayrollClosed: 'PAYROLL_CLOSED',
} as const;
