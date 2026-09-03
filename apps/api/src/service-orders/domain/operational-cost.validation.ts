import {
  assertCurrencyCode,
  normalizeMoneyAmount,
  parseOptionalMoneyAmount,
} from '../../commercial/domain/money';
import {
  assertOperationalCostCategory,
  assertOperationalCostKind,
  assertOperationalCostOrigin,
  assertOperationalCostOriginConsistency,
  type OperationalCostCategory,
  type OperationalCostKind,
  type OperationalCostOrigin,
} from './operational-cost';

export type RecordOperationalCostInput = {
  origin: OperationalCostOrigin;
  sourceExecutionEntryId?: string | null;
  category: OperationalCostCategory;
  costKind: OperationalCostKind;
  description?: string | null;
  amount: string;
  currencyCode?: string;
  quantityValue?: string | null;
  quantityUnitCode?: string | null;
  originContext?: Record<string, unknown>;
  idempotencyKey?: string | null;
  rowVersion: number;
};

function readOptionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

export function validateRecordOperationalCostInput(body: unknown): RecordOperationalCostInput {
  if (!body || typeof body !== 'object') {
    throw new Error('VALIDATION_FAILED');
  }
  const record = body as Record<string, unknown>;
  const origin = assertOperationalCostOrigin(readOptionalString(record, 'origin') ?? '');
  const sourceExecutionEntryId =
    typeof record.sourceExecutionEntryId === 'string' ? record.sourceExecutionEntryId : null;
  assertOperationalCostOriginConsistency(origin, sourceExecutionEntryId);
  const category = assertOperationalCostCategory(readOptionalString(record, 'category') ?? '');
  const costKind = assertOperationalCostKind(readOptionalString(record, 'costKind') ?? '');
  const amountRaw = record.amount;
  const amount = parseOptionalMoneyAmount(
    typeof amountRaw === 'string' || typeof amountRaw === 'number' ? String(amountRaw) : '',
  );
  if (!amount) {
    throw new Error('VALIDATION_FAILED');
  }
  normalizeMoneyAmount(amount);
  const rowVersion = Number(record.rowVersion);
  if (!Number.isInteger(rowVersion) || rowVersion < 1) {
    throw new Error('VALIDATION_FAILED');
  }
  return {
    origin,
    sourceExecutionEntryId,
    category,
    costKind,
    description: typeof record.description === 'string' ? record.description : null,
    amount,
    currencyCode: assertCurrencyCode(
      typeof record.currencyCode === 'string' ? record.currencyCode : undefined,
    ),
    quantityValue:
      typeof record.quantityValue === 'string' ? parseOptionalMoneyAmount(record.quantityValue) : null,
    quantityUnitCode: typeof record.quantityUnitCode === 'string' ? record.quantityUnitCode : null,
    originContext:
      record.originContext && typeof record.originContext === 'object'
        ? (record.originContext as Record<string, unknown>)
        : {},
    idempotencyKey: typeof record.idempotencyKey === 'string' ? record.idempotencyKey : null,
    rowVersion,
  };
}
