import { isPositiveMoneyAmount, normalizeMoneyAmount } from '../../platform/kernel/money-math';
import { COLLECTION_ACTION_KINDS, CollectionError } from './collection';

export type RecordCollectionActionInput = {
  kind: string;
  notes?: string | null;
  idempotencyKey: string;
};

export type RecordCollectionPromiseInput = {
  promisedAmount: string;
  promisedOn: string;
  notes?: string | null;
  idempotencyKey: string;
};

export type RenegotiateCollectionInput = {
  version: number;
  promisedDueDate: string;
  promisedAmount?: string;
  promisedOn?: string;
  notes?: string | null;
  idempotencyKey: string;
};

const ACTION_SET = new Set<string>(Object.values(COLLECTION_ACTION_KINDS));

function requireText(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    throw new CollectionError('COLLECTION_INVALID');
  }
  return trimmed;
}

function requireDate(value: string): string {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new CollectionError('COLLECTION_INVALID');
  }
  return trimmed;
}

function requireVersion(version: number): number {
  if (!Number.isInteger(version) || version < 1) {
    throw new CollectionError('COLLECTION_VERSION_CONFLICT');
  }
  return version;
}

export function validateRecordCollectionActionInput(
  input: RecordCollectionActionInput,
): { kind: string; notes: string | null; idempotencyKey: string } {
  const kind = requireText(input.kind).toUpperCase();
  if (!ACTION_SET.has(kind) || kind === COLLECTION_ACTION_KINDS.PromiseToPay) {
    throw new CollectionError('COLLECTION_INVALID');
  }
  return {
    kind,
    notes: input.notes?.trim() || null,
    idempotencyKey: requireText(input.idempotencyKey),
  };
}

export function validateRecordCollectionPromiseInput(input: RecordCollectionPromiseInput): {
  promisedAmount: string;
  promisedOn: string;
  notes: string | null;
  idempotencyKey: string;
} {
  const promisedAmount = normalizeMoneyAmount(input.promisedAmount);
  if (!isPositiveMoneyAmount(promisedAmount)) {
    throw new CollectionError('COLLECTION_INVALID');
  }
  return {
    promisedAmount,
    promisedOn: requireDate(input.promisedOn),
    notes: input.notes?.trim() || null,
    idempotencyKey: requireText(input.idempotencyKey),
  };
}

export function validateRenegotiateCollectionInput(input: RenegotiateCollectionInput): {
  version: number;
  promisedDueDate: string;
  promisedAmount: string | null;
  promisedOn: string | null;
  notes: string | null;
  idempotencyKey: string;
} {
  const promisedAmount = input.promisedAmount
    ? normalizeMoneyAmount(input.promisedAmount)
    : null;
  const promisedOn = input.promisedOn ? requireDate(input.promisedOn) : null;
  if (promisedAmount && !isPositiveMoneyAmount(promisedAmount)) {
    throw new CollectionError('COLLECTION_INVALID');
  }
  if ((promisedAmount && !promisedOn) || (!promisedAmount && promisedOn)) {
    throw new CollectionError('COLLECTION_INVALID');
  }
  return {
    version: requireVersion(input.version),
    promisedDueDate: requireDate(input.promisedDueDate),
    promisedAmount,
    promisedOn,
    notes: input.notes?.trim() || null,
    idempotencyKey: requireText(input.idempotencyKey),
  };
}
