import { formatMoneyAmountForApi } from '../../platform/kernel/money-math';
import { derivedBalance, reconcileAccount } from '../domain/treasury';
import type {
  BankAccountRow,
  CashAccountRow,
  FinancialAccountRow,
  FinancialTransactionRow,
  TreasuryTransferRow,
} from '../repositories/treasury.repository.types';

export type FinancialAccountResponse = {
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

export type TreasuryMovementResponse = {
  id: string;
  accountId: string;
  direction: string;
  amount: string;
  currencyCode: string;
  occurredAt: string;
  status: string;
  idempotencyKey: string;
  reference: string;
  originKind: string;
  originId: string;
  originReference: string;
  transferId: string | null;
  reversesTransactionId: string | null;
  actorIdentityId: string;
  createdAt: string;
};

export type TreasuryTransferResponse = {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  kind: string;
  amount: string;
  currencyCode: string;
  occurredAt: string;
  idempotencyKey: string;
  reference: string;
  originKind: string;
  originId: string;
  originReference: string;
  reversesTransferId: string | null;
  actorIdentityId: string;
  legs: TreasuryMovementResponse[];
};

export type TreasuryReconciliationResponse = {
  accountId: string;
  balance: string;
  credits: string;
  debits: string;
  movementCount: number;
};

export function toMovementResponse(row: FinancialTransactionRow): TreasuryMovementResponse {
  return {
    id: row.id,
    accountId: row.account_id,
    direction: row.direction,
    amount: formatMoneyAmountForApi(row.amount) ?? row.amount,
    currencyCode: row.currency_code,
    occurredAt: row.occurred_at,
    status: row.status,
    idempotencyKey: row.idempotency_key,
    reference: row.reference,
    originKind: row.origin_kind,
    originId: row.origin_id,
    originReference: row.origin_reference,
    transferId: row.transfer_id,
    reversesTransactionId: row.reverses_transaction_id,
    actorIdentityId: row.actor_identity_id,
    createdAt: row.created_at,
  };
}

export function toAccountResponse(
  row: FinancialAccountRow,
  movements: FinancialTransactionRow[],
  bank: BankAccountRow | null,
  cash: CashAccountRow | null,
): FinancialAccountResponse {
  const balance = derivedBalance(
    movements.map((item) => ({
      direction: item.direction,
      amount: item.amount,
      status: item.status,
    })),
  );
  return {
    id: row.id,
    unitId: row.unit_id,
    kind: row.kind,
    code: row.code,
    name: row.name,
    currencyCode: row.currency_code,
    overdraftAllowed: row.overdraft_allowed,
    lifecycle: row.lifecycle,
    rowVersion: row.row_version,
    balance: formatMoneyAmountForApi(balance) ?? balance,
    bank: bank
      ? { bankCode: bank.bank_code, agency: bank.agency, accountNumber: bank.account_number }
      : null,
    cash: cash ? { locationCode: cash.location_code } : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toTransferResponse(
  row: TreasuryTransferRow,
  legs: FinancialTransactionRow[],
): TreasuryTransferResponse {
  return {
    id: row.id,
    fromAccountId: row.from_account_id,
    toAccountId: row.to_account_id,
    kind: row.kind,
    amount: formatMoneyAmountForApi(row.amount) ?? row.amount,
    currencyCode: row.currency_code,
    occurredAt: row.occurred_at,
    idempotencyKey: row.idempotency_key,
    reference: row.reference,
    originKind: row.origin_kind,
    originId: row.origin_id,
    originReference: row.origin_reference,
    reversesTransferId: row.reverses_transfer_id,
    actorIdentityId: row.actor_identity_id,
    legs: legs.map(toMovementResponse),
  };
}

export function toReconciliationResponse(
  accountId: string,
  movements: FinancialTransactionRow[],
): TreasuryReconciliationResponse {
  const result = reconcileAccount({
    movements: movements.map((item) => ({
      direction: item.direction,
      amount: item.amount,
      status: item.status,
    })),
  });
  return {
    accountId,
    balance: formatMoneyAmountForApi(result.balance) ?? result.balance,
    credits: formatMoneyAmountForApi(result.credits) ?? result.credits,
    debits: formatMoneyAmountForApi(result.debits) ?? result.debits,
    movementCount: movements.length,
  };
}
