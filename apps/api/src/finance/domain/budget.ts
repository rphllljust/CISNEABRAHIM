import {
  normalizeMoneyAmount,
  subtractMoneyAmounts,
  sumMoneyAmounts,
} from '../../platform/kernel/money-math';

export const BUDGET_STATUSES = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const;

export const BUDGET_VERSION_STATUSES = {
  Draft: 'DRAFT',
  Approved: 'APPROVED',
} as const;

export const BUDGET_PERIOD_STATUSES = {
  Open: 'OPEN',
  Closed: 'CLOSED',
} as const;

export class BudgetError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

const PERIOD_KEY_PATTERN = /^\d{4}-\d{2}$/;
const ISO_DATE_PATTERN = /^(\d{4}-\d{2}-\d{2})/;

export function asBudgetIsoDate(value: string | Date): string {
  if (value instanceof Date) {
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const match = ISO_DATE_PATTERN.exec(String(value).trim());
  if (!match) {
    throw new BudgetError('BUDGET_PERIOD_INVALID');
  }
  return match[1]!;
}

export function assertBudgetPeriodKey(periodKey: string): string {
  const trimmed = periodKey.trim();
  if (!PERIOD_KEY_PATTERN.test(trimmed)) {
    throw new BudgetError('BUDGET_PERIOD_INVALID');
  }
  return trimmed;
}

export function assertBudgetVersionEditable(status: string): void {
  if (status === BUDGET_VERSION_STATUSES.Approved) {
    throw new BudgetError('BUDGET_VERSION_IMMUTABLE');
  }
  if (status !== BUDGET_VERSION_STATUSES.Draft) {
    throw new BudgetError('BUDGET_INVALID');
  }
}

export function assertBudgetVersionCanApprove(status: string): void {
  if (status !== BUDGET_VERSION_STATUSES.Draft) {
    throw new BudgetError('BUDGET_NOT_DRAFT');
  }
}

export function assertBudgetHasApprovingContent(periodCount: number, lineCount: number): void {
  if (periodCount < 1 || lineCount < 1) {
    throw new BudgetError('BUDGET_INCOMPLETE');
  }
}

export function assertBudgetPeriodsDoNotOverlap(periods: Array<{ startsOn: string; endsOn: string }>): void {
  const sorted = [...periods].sort((left, right) => left.startsOn.localeCompare(right.startsOn));
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1]!;
    const current = sorted[index]!;
    if (current.startsOn <= previous.endsOn) {
      throw new BudgetError('BUDGET_PERIOD_OVERLAP');
    }
  }
}

export function assertBudgetLineHasDimension(input: {
  costCenterCode?: string | null;
  expenseCategoryId?: string | null;
  accountId?: string | null;
}): void {
  if (!input.costCenterCode && !input.expenseCategoryId && !input.accountId) {
    throw new BudgetError('BUDGET_LINE_DIMENSION_REQUIRED');
  }
}

export type BudgetComparisonLine = {
  lineId: string;
  periodKey: string;
  budgeted: string;
  actual: string;
  variance: string;
  actualSource: 'POSTED_JOURNAL' | 'NONE';
};

function asSignedMoney(value: string): string {
  if (value.startsWith('-')) {
    return `-${normalizeMoneyAmount(value.slice(1) === '0' ? '0.0000' : value.slice(1))}`;
  }
  return normalizeMoneyAmount(value === '0' ? '0.0000' : value);
}

export function compareBudgetLine(input: {
  lineId: string;
  periodKey: string;
  budgeted: string;
  actual: string;
  actualSource: 'POSTED_JOURNAL' | 'NONE';
}): BudgetComparisonLine {
  const budgeted = asSignedMoney(input.budgeted);
  const actual = asSignedMoney(input.actual);
  return {
    lineId: input.lineId,
    periodKey: input.periodKey,
    budgeted,
    actual,
    variance: asSignedMoney(subtractMoneyAmounts(actual, budgeted)),
    actualSource: input.actualSource,
  };
}

export function summarizeBudgetComparison(lines: BudgetComparisonLine[]): {
  budgeted: string;
  actual: string;
  variance: string;
} {
  const budgeted = asSignedMoney(sumMoneyAmounts(lines.map((item) => item.budgeted)));
  const actual = asSignedMoney(sumMoneyAmounts(lines.map((item) => item.actual)));
  return {
    budgeted,
    actual,
    variance: asSignedMoney(subtractMoneyAmounts(actual, budgeted)),
  };
}
