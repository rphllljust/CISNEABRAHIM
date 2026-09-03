import {
  moneyAmountsEqual,
  normalizeMoneyAmount,
  isPositiveMoneyAmount,
  sumMoneyAmounts,
} from '../../platform/kernel/money-math';

export const ACCOUNT_CLASSES = {
  Asset: 'ASSET',
  Liability: 'LIABILITY',
  Equity: 'EQUITY',
  Revenue: 'REVENUE',
  Expense: 'EXPENSE',
} as const;

export type AccountClass = (typeof ACCOUNT_CLASSES)[keyof typeof ACCOUNT_CLASSES];

export const JOURNAL_STATUSES = {
  Draft: 'DRAFT',
  Posted: 'POSTED',
} as const;

export type JournalStatus = (typeof JOURNAL_STATUSES)[keyof typeof JOURNAL_STATUSES];

export const JOURNAL_KINDS = {
  Entry: 'ENTRY',
  Reversal: 'REVERSAL',
} as const;

export const JOURNAL_DIRECTIONS = {
  Debit: 'DEBIT',
  Credit: 'CREDIT',
} as const;

export type JournalDirection = (typeof JOURNAL_DIRECTIONS)[keyof typeof JOURNAL_DIRECTIONS];

export const PERIOD_STATUSES = {
  Open: 'OPEN',
  Closed: 'CLOSED',
} as const;

export const JOURNAL_SOURCE_KINDS = {
  Manual: 'MANUAL',
  Billing: 'BILLING',
  Settlement: 'SETTLEMENT',
  Payment: 'PAYMENT',
  Inventory: 'INVENTORY',
  Payroll: 'PAYROLL',
  Tax: 'TAX',
  FixedAsset: 'FIXED_ASSET',
} as const;

export type JournalSourceKind = (typeof JOURNAL_SOURCE_KINDS)[keyof typeof JOURNAL_SOURCE_KINDS];

const SOURCE_KIND_SET = new Set<string>(Object.values(JOURNAL_SOURCE_KINDS));
const ACCOUNT_CLASS_SET = new Set<string>(Object.values(ACCOUNT_CLASSES));

export class AccountingError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export type JournalLineDraft = {
  lineNumber: number;
  accountId: string;
  direction: string;
  amount: string;
  description?: string | null;
};

export function assertAccountClass(value: string): AccountClass {
  const normalized = value.trim().toUpperCase();
  if (!ACCOUNT_CLASS_SET.has(normalized)) {
    throw new AccountingError('ACCOUNTING_INVALID_ACCOUNT_CLASS');
  }
  return normalized as AccountClass;
}

export function assertSourceKind(value: string): JournalSourceKind {
  const normalized = value.trim().toUpperCase();
  if (!SOURCE_KIND_SET.has(normalized)) {
    throw new AccountingError('ACCOUNTING_INVALID_SOURCE');
  }
  return normalized as JournalSourceKind;
}

export function assertDirection(value: string): JournalDirection {
  const normalized = value.trim().toUpperCase();
  if (normalized === JOURNAL_DIRECTIONS.Debit || normalized === JOURNAL_DIRECTIONS.Credit) {
    return normalized;
  }
  throw new AccountingError('ACCOUNTING_INVALID_DIRECTION');
}

export function assertAccountingAmount(amount: string): string {
  const normalized = normalizeMoneyAmount(amount);
  if (!isPositiveMoneyAmount(normalized)) {
    throw new AccountingError('ACCOUNTING_INVALID_AMOUNT');
  }
  return normalized;
}

export function oppositeDirection(direction: string): JournalDirection {
  return assertDirection(direction) === JOURNAL_DIRECTIONS.Debit
    ? JOURNAL_DIRECTIONS.Credit
    : JOURNAL_DIRECTIONS.Debit;
}

export function debitTotal(lines: Array<{ direction: string; amount: string }>): string {
  return sumMoneyAmounts(
    lines
      .filter((line) => assertDirection(String(line.direction)) === JOURNAL_DIRECTIONS.Debit)
      .map((line) => String(line.amount)),
  );
}

export function creditTotal(lines: Array<{ direction: string; amount: string }>): string {
  return sumMoneyAmounts(
    lines
      .filter((line) => assertDirection(String(line.direction)) === JOURNAL_DIRECTIONS.Credit)
      .map((line) => String(line.amount)),
  );
}

export function assertBalancedEntry(lines: JournalLineDraft[]): void {
  if (lines.length < 2) {
    throw new AccountingError('ACCOUNTING_LINES_REQUIRED');
  }
  const seen = new Set<number>();
  for (const line of lines) {
    if (!Number.isInteger(line.lineNumber) || line.lineNumber < 1) {
      throw new AccountingError('ACCOUNTING_INVALID_LINE');
    }
    if (seen.has(line.lineNumber)) {
      throw new AccountingError('ACCOUNTING_DUPLICATE_LINE');
    }
    seen.add(line.lineNumber);
    assertDirection(line.direction);
    assertAccountingAmount(line.amount);
  }
  if (!moneyAmountsEqual(debitTotal(lines), creditTotal(lines))) {
    throw new AccountingError('ACCOUNTING_UNBALANCED_ENTRY');
  }
}

export function isBalanced(lines: Array<{ direction: string; amount: string }>): boolean {
  if (lines.length < 2) {
    return false;
  }
  return moneyAmountsEqual(debitTotal(lines), creditTotal(lines));
}

export function assertDraftMutable(status: string): void {
  if (status !== JOURNAL_STATUSES.Draft) {
    throw new AccountingError('ACCOUNTING_ENTRY_IMMUTABLE');
  }
}

export function assertPosted(status: string): void {
  if (status !== JOURNAL_STATUSES.Posted) {
    throw new AccountingError('ACCOUNTING_NOT_POSTED');
  }
}

export function assertPeriodOpen(status: string): void {
  if (status !== PERIOD_STATUSES.Open) {
    throw new AccountingError('ACCOUNTING_PERIOD_CLOSED');
  }
}

export function assertOccurredInPeriod(occurredOn: string, startsOn: string, endsOn: string): void {
  const day = occurredOn.slice(0, 10);
  if (day < startsOn.slice(0, 10) || day > endsOn.slice(0, 10)) {
    throw new AccountingError('ACCOUNTING_DATE_OUTSIDE_PERIOD');
  }
}

export function reconstructLedger(
  lines: Array<{ accountId: string; direction: string; amount: string }>,
): {
  byAccount: Record<string, { debits: string; credits: string }>;
  totalDebits: string;
  totalCredits: string;
  balanced: boolean;
} {
  const byAccount: Record<string, { debits: string; credits: string }> = {};
  for (const line of lines) {
    const bucket = byAccount[line.accountId] ?? { debits: '0.0000', credits: '0.0000' };
    const amount = String(line.amount);
    if (assertDirection(String(line.direction)) === JOURNAL_DIRECTIONS.Debit) {
      bucket.debits = sumMoneyAmounts([bucket.debits, amount]);
    } else {
      bucket.credits = sumMoneyAmounts([bucket.credits, amount]);
    }
    byAccount[line.accountId] = bucket;
  }
  const totalDebits = debitTotal(lines);
  const totalCredits = creditTotal(lines);
  return {
    byAccount,
    totalDebits,
    totalCredits,
    balanced: isBalanced(lines),
  };
}

export function reversalLines(lines: JournalLineDraft[]): JournalLineDraft[] {
  return lines.map((line) => ({
    ...line,
    direction: oppositeDirection(line.direction),
  }));
}
