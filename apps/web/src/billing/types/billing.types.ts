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

export const BILLING_ERROR_CODES = {
  VALIDATION_FAILED: 'BILLING_VALIDATION_FAILED',
  DENIED: 'BILLING_DENIED',
  NOT_FOUND: 'BILLING_NOT_FOUND',
  SERVICE_ORDER_NOT_FOUND: 'BILLING_SERVICE_ORDER_NOT_FOUND',
  MEASUREMENT_NOT_FOUND: 'BILLING_MEASUREMENT_NOT_FOUND',
  MEASUREMENT_NOT_APPROVED: 'BILLING_MEASUREMENT_NOT_APPROVED',
  BILLING_ALREADY_EXISTS: 'BILLING_BILLING_ALREADY_EXISTS',
  BILLING_ITEMS_REQUIRED: 'BILLING_ITEMS_REQUIRED',
  BILLING_AMOUNT_MISMATCH: 'BILLING_AMOUNT_MISMATCH',
  COMMERCIAL_TERMS_MISMATCH: 'BILLING_COMMERCIAL_TERMS_MISMATCH',
  INVALID_STATE: 'BILLING_INVALID_STATE',
  VERSION_CONFLICT: 'BILLING_VERSION_CONFLICT',
  CLIENT_NOT_FOUND: 'BILLING_CLIENT_NOT_FOUND',
} as const;

export type BillingErrorCode = (typeof BILLING_ERROR_CODES)[keyof typeof BILLING_ERROR_CODES];

export type BillingItem = {
  id: string;
  lineNumber: number;
  measurementItemId: string;
  sourceExecutionEntryId: string | null;
  unitCode: string;
  quantity: string;
  unitPrice: string | null;
  lineAmount: string;
  pricingLineSnapshot: Record<string, unknown>;
  lineLabel: string;
};

export type BillingHistoryEvent = {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  actorIdentityId: string | null;
  occurredAt: string;
};

export type BillingRecordDetail = {
  id: string;
  serviceOrderId: string;
  measurementId: string;
  clientId: string;
  unitId: string;
  status: BillingRecordStatus;
  proposalId: string | null;
  purchaseOrderId: string | null;
  contractReference: string | null;
  clientLegalNameSnapshot: string;
  clientTaxIdSnapshot: string | null;
  billingAddressSnapshot: Record<string, unknown>;
  commercialReferenceSnapshot: Record<string, unknown>;
  currencyCode: string;
  paymentTerms: string;
  paymentTermsSource: string;
  paymentTermsAuthoritative: string | null;
  totalAmount: string;
  preparedAt: string;
  preparedByIdentityId: string;
  voidedAt: string | null;
  voidedByIdentityId: string | null;
  voidReason: string | null;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
  items: BillingItem[];
  historyEvents: BillingHistoryEvent[];
};

export type PrepareBillingRecordPayload = {
  measurementId: string;
  paymentTerms: string;
  assertedTotalAmount?: string;
  idempotencyKey?: string;
};

export type VoidBillingRecordPayload = {
  rowVersion: number;
  voidReason?: string;
};

export type BillingCapabilities = {
  canRead: boolean;
  canPrepare: boolean;
  canVoid: boolean;
};

export const BILLING_PROCESS_BUCKETS = {
  Ready: 'ready',
  Prepared: 'prepared',
  Divergence: 'divergence',
} as const;

export type BillingProcessBucket =
  (typeof BILLING_PROCESS_BUCKETS)[keyof typeof BILLING_PROCESS_BUCKETS];

export type CommercialTermsDivergence = {
  authoritativeLabel: string;
  authoritativeValue: string;
  declaredLabel: string;
  declaredValue: string;
};

export type BillingWorkQueueItem = {
  serviceOrderId: string;
  orderNumber: string;
  clientLabel: string;
  measurementId: string | null;
  billingId: string | null;
  totalAmount: string | null;
  bucket: BillingProcessBucket;
  termsDivergence: CommercialTermsDivergence | null;
};
