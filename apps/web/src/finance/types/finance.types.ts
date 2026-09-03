export type ReceivableInstallment = {
  id: string;
  installmentNumber: number;
  principal: string;
  dueDate: string;
};

export type Settlement = {
  id: string;
  installmentId: string | null;
  amount: string;
  currencyCode: string;
  status: string;
  settledAt: string;
  idempotencyKey: string;
  externalReference: string | null;
};

export type ReceivableDetail = {
  id: string;
  unitId: string;
  clientId: string;
  origin: {
    kind: string;
    billingDocumentId: string;
    billingRecordId: string;
    serviceOrderId: string;
    measurementId: string;
  };
  principal: string;
  currencyCode: string;
  dueDate: string;
  paymentTerms: string;
  externalReference: string | null;
  status: string;
  remainingBalance: string;
  settledAmount: string;
  lifecycle: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
  installments: ReceivableInstallment[];
  settlements: Settlement[];
};

export type PayableInstallment = {
  id: string;
  installmentNumber: number;
  principal: string;
  dueDate: string;
};

export type Payment = {
  id: string;
  installmentId: string;
  kind: string;
  amount: string;
  currencyCode: string;
  paidAt: string;
  idempotencyKey: string;
  paymentReference: string;
  originKind: string;
  originId: string;
  originReference: string;
  reversesPaymentId: string | null;
  actorIdentityId: string;
  createdAt: string;
};

export type PayableDetail = {
  id: string;
  unitId: string;
  counterpartyId: string;
  origin: { kind: string; id: string; reference: string };
  expenseCategoryId: string;
  costCenter: { id: string; code: string };
  principal: string;
  currencyCode: string;
  dueDate: string;
  paymentTerms: string;
  externalReference: string | null;
  status: string;
  agingBucket: string;
  remainingBalance: string;
  paidAmount: string;
  lifecycle: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
  installments: PayableInstallment[];
  payments: Payment[];
};

export type PayableAgingSummary = Record<string, { count: number; remaining: string }>;

export type PayableAgingResponse = {
  asOf: string;
  buckets: PayableAgingSummary;
};

export type FinancialAccount = {
  id: string;
  unitId: string;
  kind: string;
  code: string;
  name: string;
  currencyCode: string;
  overdraftAllowed: boolean;
  lifecycle: string;
  rowVersion: number;
  balance: string;
  bank: { bankCode: string; agency: string; accountNumber: string } | null;
  cash: { locationCode: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type TreasuryReconciliation = {
  accountId: string;
  balance: string;
  credits: string;
  debits: string;
  movementCount: number;
};

export type BankStatementLine = {
  id: string;
  lineNumber: number;
  occurredOn: string;
  direction: string;
  amount: string;
  description: string;
  sourceLineKey: string;
  matchStatus: string;
  duplicate: boolean;
};

export type BankStatement = {
  id: string;
  unitId: string;
  financialAccountId: string;
  sourceKind: string;
  sourceReference: string;
  periodStartsOn: string;
  periodEndsOn: string;
  status: string;
  idempotent: boolean;
  lines: BankStatementLine[];
};

export type ReconciliationMatch = {
  id: string;
  bankStatementId: string;
  bankStatementLineId: string;
  status: string;
  matchMethod: string;
  matchCriteria: string;
  match: {
    targetKind: string;
    targetId: string;
    financialTransactionId: string;
    amount: string;
  } | null;
};

export type AutoMatchResult = {
  statementId: string;
  suggested: ReconciliationMatch[];
  reviewRequired: string[];
  unmatched: string[];
  autoMatchedConfirmed: number;
};

export type FinanceCapabilities = {
  canListReceivables: boolean;
  canListPayables: boolean;
  canListTreasury: boolean;
  canReadReconciliation: boolean;
};
