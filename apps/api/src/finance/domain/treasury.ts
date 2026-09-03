import {
  assertCurrencyCode,
  compareMoneyAmounts,
  isPositiveMoneyAmount,
  isZeroMoneyAmount,
  moneyAmountsEqual,
  normalizeMoneyAmount,
  subtractMoneyAmounts,
  sumMoneyAmounts,
} from '../../platform/kernel/money-math';

export const FINANCIAL_ACCOUNT_KINDS = {
  Bank: 'BANK',
  Cash: 'CASH',
} as const;

export type FinancialAccountKind =
  (typeof FINANCIAL_ACCOUNT_KINDS)[keyof typeof FINANCIAL_ACCOUNT_KINDS];

export const FINANCIAL_ACCOUNT_LIFECYCLES = {
  Active: 'ACTIVE',
  Closed: 'CLOSED',
} as const;

export const FINANCIAL_DIRECTIONS = {
  Credit: 'CREDIT',
  Debit: 'DEBIT',
} as const;

export type FinancialDirection = (typeof FINANCIAL_DIRECTIONS)[keyof typeof FINANCIAL_DIRECTIONS];

export const FINANCIAL_TRANSACTION_STATUSES = {
  Posted: 'POSTED',
} as const;

export const TREASURY_TRANSFER_KINDS = {
  Transfer: 'TRANSFER',
  Reversal: 'REVERSAL',
} as const;

export const TREASURY_ORIGIN_KINDS = {
  OpeningBalance: 'OPENING_BALANCE',
  ManualAuthorized: 'MANUAL_AUTHORIZED',
  PayablePayment: 'PAYABLE_PAYMENT',
  ReceivableSettlement: 'RECEIVABLE_SETTLEMENT',
  Transfer: 'TRANSFER',
  Reversal: 'REVERSAL',
} as const;

export type TreasuryOriginKind = (typeof TREASURY_ORIGIN_KINDS)[keyof typeof TREASURY_ORIGIN_KINDS];

const ORIGIN_KIND_SET = new Set<string>(Object.values(TREASURY_ORIGIN_KINDS));

export class TreasuryError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export type PostedTreasuryMovement = {
  direction: string;
  amount: string;
  status: string;
};

export function assertTreasuryOriginKind(kind: string): TreasuryOriginKind {
  const normalized = kind.trim().toUpperCase();
  if (!ORIGIN_KIND_SET.has(normalized)) {
    throw new TreasuryError('TREASURY_INVALID_ORIGIN');
  }
  return normalized as TreasuryOriginKind;
}

export function assertAccountKind(kind: string): FinancialAccountKind {
  const normalized = kind.trim().toUpperCase();
  if (normalized === FINANCIAL_ACCOUNT_KINDS.Bank || normalized === FINANCIAL_ACCOUNT_KINDS.Cash) {
    return normalized;
  }
  throw new TreasuryError('TREASURY_INVALID_ACCOUNT_KIND');
}

export function assertDirection(direction: string): FinancialDirection {
  const normalized = direction.trim().toUpperCase();
  if (normalized === FINANCIAL_DIRECTIONS.Credit || normalized === FINANCIAL_DIRECTIONS.Debit) {
    return normalized;
  }
  throw new TreasuryError('TREASURY_INVALID_DIRECTION');
}

export function oppositeDirection(direction: string): FinancialDirection {
  return assertDirection(direction) === FINANCIAL_DIRECTIONS.Credit
    ? FINANCIAL_DIRECTIONS.Debit
    : FINANCIAL_DIRECTIONS.Credit;
}

export function assertTreasuryAmount(amount: string): string {
  const normalized = normalizeMoneyAmount(amount);
  if (!isPositiveMoneyAmount(normalized)) {
    throw new TreasuryError('TREASURY_INVALID_AMOUNT');
  }
  return normalized;
}

export function signedMovementAmount(direction: string, amount: string): string {
  return assertTreasuryAmount(amount);
}

export function derivedBalance(movements: PostedTreasuryMovement[]): string {
  const posted = movements.filter((item) => item.status === FINANCIAL_TRANSACTION_STATUSES.Posted);
  const credits = sumMoneyAmounts(
    posted
      .filter((item) => assertDirection(item.direction) === FINANCIAL_DIRECTIONS.Credit)
      .map((item) => item.amount),
  );
  const debits = sumMoneyAmounts(
    posted
      .filter((item) => assertDirection(item.direction) === FINANCIAL_DIRECTIONS.Debit)
      .map((item) => item.amount),
  );
  return subtractMoneyAmounts(credits, debits);
}

export function assertAccountActive(lifecycle: string): void {
  if (lifecycle !== FINANCIAL_ACCOUNT_LIFECYCLES.Active) {
    throw new TreasuryError('TREASURY_ACCOUNT_CLOSED');
  }
}

export function assertSameCurrency(left: string, right: string): void {
  if (assertCurrencyCode(left) !== assertCurrencyCode(right)) {
    throw new TreasuryError('TREASURY_CURRENCY_MISMATCH');
  }
}

export function assertSufficientBalance(input: {
  currentBalance: string;
  debitAmount: string;
  overdraftAllowed: boolean;
}): void {
  if (input.overdraftAllowed) {
    return;
  }
  const debit = assertTreasuryAmount(input.debitAmount);
  const current = normalizeMoneyAmount(input.currentBalance);
  if (compareMoneyAmounts(debit, current) > 0) {
    throw new TreasuryError('TREASURY_INSUFFICIENT_BALANCE');
  }
}

export function assertTransferLegs(input: {
  fromAccountId: string;
  toAccountId: string;
  debit: { accountId: string; direction: string; amount: string };
  credit: { accountId: string; direction: string; amount: string };
}): void {
  if (input.fromAccountId === input.toAccountId) {
    throw new TreasuryError('TREASURY_SAME_ACCOUNT_TRANSFER');
  }
  if (input.debit.accountId !== input.fromAccountId || input.credit.accountId !== input.toAccountId) {
    throw new TreasuryError('TREASURY_UNBALANCED_TRANSFER');
  }
  if (assertDirection(input.debit.direction) !== FINANCIAL_DIRECTIONS.Debit) {
    throw new TreasuryError('TREASURY_UNBALANCED_TRANSFER');
  }
  if (assertDirection(input.credit.direction) !== FINANCIAL_DIRECTIONS.Credit) {
    throw new TreasuryError('TREASURY_UNBALANCED_TRANSFER');
  }
  if (!moneyAmountsEqual(input.debit.amount, input.credit.amount)) {
    throw new TreasuryError('TREASURY_UNBALANCED_TRANSFER');
  }
}

export function transferNetZero(legs: PostedTreasuryMovement[]): boolean {
  return isZeroMoneyAmount(derivedBalance(legs));
}

export function reconcileAccount(input: {
  movements: PostedTreasuryMovement[];
}): { balance: string; credits: string; debits: string } {
  const posted = input.movements.filter(
    (item) => item.status === FINANCIAL_TRANSACTION_STATUSES.Posted,
  );
  const credits = sumMoneyAmounts(
    posted
      .filter((item) => item.direction === FINANCIAL_DIRECTIONS.Credit)
      .map((item) => item.amount),
  );
  const debits = sumMoneyAmounts(
    posted
      .filter((item) => item.direction === FINANCIAL_DIRECTIONS.Debit)
      .map((item) => item.amount),
  );
  return {
    balance: derivedBalance(posted),
    credits,
    debits,
  };
}

export function assertTransactionImmutable(): never {
  throw new TreasuryError('TREASURY_TRANSACTION_IMMUTABLE');
}

export function reversalCapacity(originalAmount: string, existingReversals: string[]): string {
  return subtractMoneyAmounts(normalizeMoneyAmount(originalAmount), sumMoneyAmounts(existingReversals));
}

export function assertReversalAmount(
  originalAmount: string,
  existingReversals: string[],
  incomingAmount: string,
): string {
  const amount = assertTreasuryAmount(incomingAmount);
  const capacity = reversalCapacity(originalAmount, existingReversals);
  if (compareMoneyAmounts(amount, capacity) > 0) {
    throw new TreasuryError('TREASURY_REVERSAL_EXCEEDS_MOVEMENT');
  }
  if (isZeroMoneyAmount(capacity)) {
    throw new TreasuryError('TREASURY_ALREADY_REVERSED');
  }
  return amount;
}
