import {
  compareMoneyAmounts,
  formatMoneyAmountForApi,
  isZeroMoneyAmount,
  moneyAmountsEqual,
  subtractMoneyAmounts,
  sumMoneyAmounts,
} from '../../platform/kernel/money-math';
import { ACCOUNT_CLASSES, AccountingError, JOURNAL_DIRECTIONS } from './ledger';

export type PostedLineFact = {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountClass: string;
  direction: string;
  amount: string;
};

export type AccountPeriodTotals = {
  accountId: string;
  code: string;
  name: string;
  class: string;
  openingDebits: string;
  openingCredits: string;
  periodDebits: string;
  periodCredits: string;
  closingDebits: string;
  closingCredits: string;
  trialDebit: string;
  trialCredit: string;
};

function amount(value: string): string {
  return String(value);
}

export function combineDebitCredit(
  opening: { debits: string; credits: string },
  period: { debits: string; credits: string },
): { closingDebits: string; closingCredits: string; trialDebit: string; trialCredit: string } {
  const closingDebits = sumMoneyAmounts([opening.debits, period.debits]);
  const closingCredits = sumMoneyAmounts([opening.credits, period.credits]);
  const cmp = compareMoneyAmounts(closingDebits, closingCredits);
  if (cmp > 0) {
    return {
      closingDebits,
      closingCredits,
      trialDebit: subtractMoneyAmounts(closingDebits, closingCredits),
      trialCredit: '0.0000',
    };
  }
  if (cmp < 0) {
    return {
      closingDebits,
      closingCredits,
      trialDebit: '0.0000',
      trialCredit: subtractMoneyAmounts(closingCredits, closingDebits),
    };
  }
  return {
    closingDebits,
    closingCredits,
    trialDebit: '0.0000',
    trialCredit: '0.0000',
  };
}

export function totalsByAccount(
  accounts: Array<{ id: string; code: string; name: string; class: string }>,
  openingLines: PostedLineFact[],
  periodLines: PostedLineFact[],
): AccountPeriodTotals[] {
  const opening = bucketByAccount(openingLines);
  const period = bucketByAccount(periodLines);
  return accounts
    .map((account) => {
      const open = opening[account.id] ?? { debits: '0.0000', credits: '0.0000' };
      const move = period[account.id] ?? { debits: '0.0000', credits: '0.0000' };
      const combined = combineDebitCredit(open, move);
      return {
        accountId: account.id,
        code: account.code,
        name: account.name,
        class: account.class,
        openingDebits: open.debits,
        openingCredits: open.credits,
        periodDebits: move.debits,
        periodCredits: move.credits,
        ...combined,
      };
    })
    .sort((left, right) => left.code.localeCompare(right.code));
}

function bucketByAccount(
  lines: PostedLineFact[],
): Record<string, { debits: string; credits: string }> {
  const buckets: Record<string, { debits: string; credits: string }> = {};
  for (const line of lines) {
    const current = buckets[line.accountId] ?? { debits: '0.0000', credits: '0.0000' };
    if (line.direction === JOURNAL_DIRECTIONS.Debit) {
      current.debits = sumMoneyAmounts([current.debits, amount(line.amount)]);
    } else {
      current.credits = sumMoneyAmounts([current.credits, amount(line.amount)]);
    }
    buckets[line.accountId] = current;
  }
  return buckets;
}

export function trialBalanceFromTotals(rows: AccountPeriodTotals[]): {
  totalDebits: string;
  totalCredits: string;
  difference: string;
  balanced: boolean;
} {
  const totalDebits = sumMoneyAmounts(rows.map((row) => row.trialDebit));
  const totalCredits = sumMoneyAmounts(rows.map((row) => row.trialCredit));
  const balanced = moneyAmountsEqual(totalDebits, totalCredits);
  const difference = balanced
    ? '0.0000'
    : compareMoneyAmounts(totalDebits, totalCredits) > 0
      ? subtractMoneyAmounts(totalDebits, totalCredits)
      : subtractMoneyAmounts(totalCredits, totalDebits);
  return { totalDebits, totalCredits, difference, balanced };
}

export function assertPeriodCloseable(input: {
  draftCount: number;
  trialBalance: { balanced: boolean; difference: string };
}): void {
  if (input.draftCount > 0) {
    throw new AccountingError('ACCOUNTING_PERIOD_HAS_DRAFTS');
  }
  if (!input.trialBalance.balanced || !isZeroMoneyAmount(input.trialBalance.difference)) {
    throw new AccountingError('ACCOUNTING_UNBALANCED_TRIAL_BALANCE');
  }
}

export function isKnownAccountClass(value: string): boolean {
  return (
    value === ACCOUNT_CLASSES.Asset ||
    value === ACCOUNT_CLASSES.Liability ||
    value === ACCOUNT_CLASSES.Equity ||
    value === ACCOUNT_CLASSES.Revenue ||
    value === ACCOUNT_CLASSES.Expense
  );
}

export function hasIncomeClassification(accounts: Array<{ class: string }>): boolean {
  return accounts.some(
    (account) =>
      account.class === ACCOUNT_CLASSES.Revenue || account.class === ACCOUNT_CLASSES.Expense,
  );
}

export function hasBalanceClassification(accounts: Array<{ class: string }>): boolean {
  return accounts.some(
    (account) =>
      account.class === ACCOUNT_CLASSES.Asset ||
      account.class === ACCOUNT_CLASSES.Liability ||
      account.class === ACCOUNT_CLASSES.Equity,
  );
}

export function assertAccountsClassified(accounts: Array<{ class: string }>): void {
  for (const account of accounts) {
    if (!isKnownAccountClass(account.class)) {
      throw new AccountingError('REPORT_CLASSIFICATION_INCOMPLETE');
    }
  }
}

export function derivePeriodNetIncome(
  accounts: Array<{ id: string; class: string }>,
  rows: AccountPeriodTotals[],
): string {
  if (!hasIncomeClassification(accounts)) {
    return '0.0000';
  }
  return incomeStatementFromTotals(accounts, rows).netIncome;
}

export function reportEquationHolds(input: {
  assets: string;
  liabilities: string;
  equity: string;
  netIncome: string;
}): boolean {
  return (
    parseReportAmount(input.assets) ===
    parseReportAmount(input.liabilities) + parseReportAmount(input.equity) + parseReportAmount(input.netIncome)
  );
}

export function incomeStatementFromTotals(
  accounts: Array<{ id: string; class: string }>,
  rows: AccountPeriodTotals[],
): {
  available: boolean;
  revenue: string;
  expense: string;
  netIncome: string;
} {
  assertAccountsClassified(accounts);
  assertAccountsClassified(rows);
  if (!hasIncomeClassification(accounts)) {
    throw new AccountingError('REPORT_CLASSIFICATION_INCOMPLETE');
  }
  const revenueCredits = sumMoneyAmounts(
    rows.filter((row) => row.class === ACCOUNT_CLASSES.Revenue).map((row) => row.periodCredits),
  );
  const revenueDebits = sumMoneyAmounts(
    rows.filter((row) => row.class === ACCOUNT_CLASSES.Revenue).map((row) => row.periodDebits),
  );
  const expenseDebits = sumMoneyAmounts(
    rows.filter((row) => row.class === ACCOUNT_CLASSES.Expense).map((row) => row.periodDebits),
  );
  const expenseCredits = sumMoneyAmounts(
    rows.filter((row) => row.class === ACCOUNT_CLASSES.Expense).map((row) => row.periodCredits),
  );
  const revenue = unsignedNet(revenueCredits, revenueDebits);
  const expense = unsignedNet(expenseDebits, expenseCredits);
  return {
    available: true,
    revenue,
    expense,
    netIncome: unsignedNet(
      sumMoneyAmounts([revenueCredits, expenseCredits]),
      sumMoneyAmounts([revenueDebits, expenseDebits]),
    ),
  };
}

export function balanceSheetFromTotals(
  accounts: Array<{ id: string; class: string }>,
  rows: AccountPeriodTotals[],
): {
  available: boolean;
  assets: string;
  liabilities: string;
  equity: string;
  netIncome: string;
  balanced: boolean;
} {
  assertAccountsClassified(accounts);
  assertAccountsClassified(rows);
  if (!hasBalanceClassification(accounts)) {
    throw new AccountingError('REPORT_CLASSIFICATION_INCOMPLETE');
  }
  const derivedNetIncome = derivePeriodNetIncome(accounts, rows);
  const assets = unsignedNet(
    sumMoneyAmounts(
      rows.filter((row) => row.class === ACCOUNT_CLASSES.Asset).map((row) => row.closingDebits),
    ),
    sumMoneyAmounts(
      rows.filter((row) => row.class === ACCOUNT_CLASSES.Asset).map((row) => row.closingCredits),
    ),
  );
  const liabilities = unsignedNet(
    sumMoneyAmounts(
      rows.filter((row) => row.class === ACCOUNT_CLASSES.Liability).map((row) => row.closingCredits),
    ),
    sumMoneyAmounts(
      rows.filter((row) => row.class === ACCOUNT_CLASSES.Liability).map((row) => row.closingDebits),
    ),
  );
  const equity = unsignedNet(
    sumMoneyAmounts(
      rows.filter((row) => row.class === ACCOUNT_CLASSES.Equity).map((row) => row.closingCredits),
    ),
    sumMoneyAmounts(
      rows.filter((row) => row.class === ACCOUNT_CLASSES.Equity).map((row) => row.closingDebits),
    ),
  );
  const trial = trialBalanceFromTotals(rows);
  const equation = reportEquationHolds({
    assets,
    liabilities,
    equity,
    netIncome: derivedNetIncome,
  });
  return {
    available: true,
    assets,
    liabilities,
    equity,
    netIncome: derivedNetIncome,
    balanced: trial.balanced && equation,
  };
}

export function formatReportAmount(value: string): string {
  const raw = String(value);
  if (raw.startsWith('-')) {
    const formatted = formatMoneyAmountForApi(raw.slice(1)) ?? raw.slice(1);
    return `-${formatted}`;
  }
  return formatMoneyAmountForApi(raw) ?? raw;
}

function unsignedNet(positive: string, negative: string): string {
  const cmp = compareMoneyAmounts(positive, negative);
  if (cmp >= 0) {
    return subtractMoneyAmounts(positive, negative);
  }
  return `-${subtractMoneyAmounts(negative, positive)}`;
}

function parseReportAmount(value: string): bigint {
  const raw = String(value).trim();
  const negative = raw.startsWith('-');
  const absolute = negative ? raw.slice(1) : raw;
  const [whole = '0', fraction = ''] = absolute.split('.');
  const paddedFraction = fraction.padEnd(4, '0').slice(0, 4);
  const scaled = BigInt(whole.length > 0 ? whole : '0') * 10_000n + BigInt(paddedFraction);
  return negative ? -scaled : scaled;
}
