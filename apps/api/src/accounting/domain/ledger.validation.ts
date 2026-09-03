import { assertUuid } from '../../platform/kernel/uuid';
import { assertCurrencyCode } from '../../platform/kernel/money-math';
import {
  AccountingError,
  assertAccountClass,
  assertAccountingAmount,
  assertBalancedEntry,
  assertDirection,
  assertSourceKind,
  type JournalLineDraft,
} from './ledger';

export class AccountingValidationError extends Error {
  constructor(readonly field: string) {
    super(field);
  }
}

export type CreateChartInput = { unitId: string; code: string; name: string };

export type CreateAccountInput = {
  code: string;
  name: string;
  class: string;
  parentId?: string;
};

export type CreatePeriodInput = {
  chartId: string;
  unitId: string;
  code: string;
  startsOn: string;
  endsOn: string;
};

export type DraftJournalInput = {
  chartId: string;
  periodId: string;
  description: string;
  occurredOn: string;
  currencyCode: string;
  sourceKind: string;
  sourceId: string;
  sourceReference: string;
  idempotencyKey: string;
  lines: JournalLineDraft[];
};

export type ReverseJournalInput = {
  rowVersion: number;
  idempotencyKey: string;
  reason: string;
};

function requireNonEmpty(value: string | undefined | null, field: string): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    throw new AccountingValidationError(field);
  }
  return trimmed;
}

function requireDate(value: string | undefined | null, field: string): string {
  const trimmed = value?.trim() ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed) && !/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    throw new AccountingValidationError(field);
  }
  return trimmed.slice(0, 10);
}

export function validateCreateChartInput(input: CreateChartInput): CreateChartInput {
  return {
    unitId: requireNonEmpty(input.unitId, 'unitId'),
    code: requireNonEmpty(input.code, 'code'),
    name: requireNonEmpty(input.name, 'name'),
  };
}

export function validateCreateAccountInput(input: CreateAccountInput): CreateAccountInput {
  let accountClass: string;
  try {
    accountClass = assertAccountClass(input.class);
  } catch {
    throw new AccountingValidationError('class');
  }
  if (input.parentId !== undefined) {
    assertUuid(input.parentId, 'parentId');
  }
  return {
    code: requireNonEmpty(input.code, 'code'),
    name: requireNonEmpty(input.name, 'name'),
    class: accountClass,
    parentId: input.parentId,
  };
}

export function validateCreatePeriodInput(input: CreatePeriodInput): CreatePeriodInput {
  assertUuid(input.chartId, 'chartId');
  const startsOn = requireDate(input.startsOn, 'startsOn');
  const endsOn = requireDate(input.endsOn, 'endsOn');
  if (endsOn < startsOn) {
    throw new AccountingValidationError('endsOn');
  }
  return {
    chartId: input.chartId,
    unitId: requireNonEmpty(input.unitId, 'unitId'),
    code: requireNonEmpty(input.code, 'code'),
    startsOn,
    endsOn,
  };
}

export function validateDraftJournalInput(input: DraftJournalInput): DraftJournalInput {
  assertUuid(input.chartId, 'chartId');
  assertUuid(input.periodId, 'periodId');
  assertUuid(input.sourceId, 'sourceId');
  let sourceKind: string;
  try {
    sourceKind = assertSourceKind(input.sourceKind);
  } catch (error) {
    if (error instanceof AccountingError) {
      throw error;
    }
    throw new AccountingValidationError('sourceKind');
  }
  let currencyCode: string;
  try {
    currencyCode = assertCurrencyCode(input.currencyCode);
  } catch {
    throw new AccountingValidationError('currencyCode');
  }
  const lines = (input.lines ?? []).map((line, index) => {
    assertUuid(line.accountId, 'lines.accountId');
    try {
      return {
        lineNumber: line.lineNumber ?? index + 1,
        accountId: line.accountId,
        direction: assertDirection(line.direction),
        amount: assertAccountingAmount(line.amount),
        description: line.description?.trim() || null,
      };
    } catch {
      throw new AccountingValidationError('lines');
    }
  });
  if (lines.length > 0) {
    try {
      assertBalancedEntry(lines);
    } catch (error) {
      if (error instanceof AccountingError && error.code === 'ACCOUNTING_UNBALANCED_ENTRY') {
        throw error;
      }
      throw new AccountingValidationError('lines');
    }
  }
  return {
    chartId: input.chartId,
    periodId: input.periodId,
    description: requireNonEmpty(input.description, 'description'),
    occurredOn: requireDate(input.occurredOn, 'occurredOn'),
    currencyCode,
    sourceKind,
    sourceId: input.sourceId,
    sourceReference: requireNonEmpty(input.sourceReference, 'sourceReference'),
    idempotencyKey: requireNonEmpty(input.idempotencyKey, 'idempotencyKey'),
    lines,
  };
}

export function validateReverseJournalInput(input: ReverseJournalInput): ReverseJournalInput {
  if (!Number.isInteger(input.rowVersion) || input.rowVersion < 1) {
    throw new AccountingValidationError('rowVersion');
  }
  const reason = requireNonEmpty(input.reason, 'reason');
  if (reason.length < 3) {
    throw new AccountingValidationError('reason');
  }
  return {
    rowVersion: input.rowVersion,
    idempotencyKey: requireNonEmpty(input.idempotencyKey, 'idempotencyKey'),
    reason,
  };
}

export function validateClosePeriodInput(input: { rowVersion: number; reason: string }) {
  if (!Number.isInteger(input.rowVersion) || input.rowVersion < 1) {
    throw new AccountingValidationError('rowVersion');
  }
  const reason = requireNonEmpty(input.reason, 'reason');
  if (reason.length < 3) {
    throw new AccountingValidationError('reason');
  }
  return { rowVersion: input.rowVersion, reason };
}

export function validateReopenPeriodInput(input: { rowVersion: number; reason: string }) {
  return validateClosePeriodInput(input);
}
