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
  BILLING_DOCUMENT_NOT_FOUND: 'BILLING_DOCUMENT_NOT_FOUND',
  BILLING_DOCUMENT_ALREADY_EXISTS: 'BILLING_DOCUMENT_ALREADY_EXISTS',
  BILLING_DOCUMENT_INVALID_STATE: 'BILLING_DOCUMENT_INVALID_STATE',
  BILLING_DOCUMENT_IMMUTABLE: 'BILLING_DOCUMENT_IMMUTABLE',
  BILLING_DOCUMENT_STORAGE_FAILED: 'BILLING_DOCUMENT_STORAGE_FAILED',
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
  canIssueDocument: boolean;
  canReadDocument: boolean;
  canDownloadDocument: boolean;
};

export const BILLING_DOCUMENT_STATUSES = {
  Finalized: 'FINALIZED',
  Cancelled: 'CANCELLED',
} as const;

export type BillingDocumentStatus =
  (typeof BILLING_DOCUMENT_STATUSES)[keyof typeof BILLING_DOCUMENT_STATUSES];

export type BillingDocumentItem = {
  id: string;
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

export type BillingDocumentDetail = {
  id: string;
  billingRecordId: string;
  serviceOrderId: string;
  measurementId: string;
  clientId: string;
  unitId: string;
  documentNumber: string;
  sequenceYear: number;
  sequenceNumber: number;
  versionNumber: number;
  replacesDocumentId: string | null;
  status: BillingDocumentStatus;
  documentCategory: string;
  emitterLegalName: string;
  emitterTaxId: string;
  emitterAddressSnapshot: Record<string, unknown>;
  clientLegalNameSnapshot: string;
  clientTaxIdSnapshot: string | null;
  billingAddressSnapshot: Record<string, unknown>;
  commercialReferenceSnapshot: Record<string, unknown>;
  proposalId: string | null;
  purchaseOrderId: string | null;
  purchaseOrderNumberSnapshot: string | null;
  contractReference: string | null;
  currencyCode: string;
  paymentTerms: string;
  dueDate: string | null;
  totalAmount: string;
  issuedAt: string;
  storedDocumentId: string | null;
  artifactSha256: string | null;
  artifactByteSize: number | null;
  cancelledAt: string | null;
  cancelledByIdentityId: string | null;
  cancelReason: string | null;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
  items: BillingDocumentItem[];
  historyEvents: unknown[];
};

export type IssueBillingDocumentPayload = {
  dueDate?: string | null;
  idempotencyKey?: string;
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
