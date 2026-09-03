export type FinancialAccountRow = {
  id: string;
  unit_id: string;
  kind: string;
  code: string;
  name: string;
  currency_code: string;
  overdraft_allowed: boolean;
  lifecycle: string;
  closed_at: string | null;
  closed_by_identity_id: string | null;
  close_reason: string | null;
  row_version: number;
  created_at: string;
  updated_at: string;
  created_by_identity_id: string;
  updated_by_identity_id: string;
};

export type BankAccountRow = {
  financial_account_id: string;
  bank_code: string;
  agency: string;
  account_number: string;
};

export type CashAccountRow = {
  financial_account_id: string;
  location_code: string;
};

export type TreasuryTransferRow = {
  id: string;
  from_account_id: string;
  to_account_id: string;
  kind: string;
  amount: string;
  currency_code: string;
  occurred_at: string;
  idempotency_key: string;
  reference: string;
  origin_kind: string;
  origin_id: string;
  origin_reference: string;
  reverses_transfer_id: string | null;
  actor_identity_id: string;
  created_at: string;
};

export type FinancialTransactionRow = {
  id: string;
  account_id: string;
  direction: string;
  amount: string;
  currency_code: string;
  occurred_at: string;
  status: string;
  idempotency_key: string;
  reference: string;
  origin_kind: string;
  origin_id: string;
  origin_reference: string;
  transfer_id: string | null;
  reverses_transaction_id: string | null;
  actor_identity_id: string;
  created_at: string;
};

export type OpenFinancialAccountPersistenceInput = {
  unitId: string;
  kind: string;
  code: string;
  name: string;
  currencyCode: string;
  overdraftAllowed: boolean;
  actorIdentityId: string;
  bank?: { bankCode: string; agency: string; accountNumber: string };
  cash?: { locationCode: string };
  opening?: {
    amount: string;
    idempotencyKey: string;
    reference: string;
    originId: string;
  };
};

export type PostTreasuryMovementPersistenceInput = {
  accountId: string;
  direction: string;
  amount: string;
  rowVersion: number;
  idempotencyKey: string;
  reference: string;
  originKind: string;
  originId: string;
  originReference: string;
  occurredAt: string;
  actorIdentityId: string;
};

export type TransferTreasuryPersistenceInput = {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  rowVersionFrom: number;
  rowVersionTo: number;
  idempotencyKey: string;
  reference: string;
  originId: string;
  originReference: string;
  occurredAt: string;
  actorIdentityId: string;
};

export type ReverseMovementPersistenceInput = {
  transactionId: string;
  amount?: string;
  rowVersion: number;
  idempotencyKey: string;
  reference: string;
  reason: string;
  actorIdentityId: string;
};

export type ReverseTransferPersistenceInput = {
  transferId: string;
  rowVersionFrom: number;
  rowVersionTo: number;
  idempotencyKey: string;
  reference: string;
  reason: string;
  actorIdentityId: string;
};
