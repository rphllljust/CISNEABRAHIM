export type IssueBillingDocumentInput = {
  dueDate?: string | null;
  idempotencyKey?: string | null;
};

export type CancelBillingDocumentInput = {
  rowVersion: number;
  cancelReason: string;
  idempotencyKey?: string | null;
};

export type ReplaceBillingDocumentInput = {
  dueDate?: string | null;
  rowVersion: number;
  replaceReason: string;
  idempotencyKey?: string | null;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function assertOptionalIsoDate(value: unknown, field: string): string | null | undefined {
  if (value === undefined || value === null) {
    return value === null ? null : undefined;
  }
  if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value.trim())) {
    throw new Error(`INVALID_${field.toUpperCase()}`);
  }
  return value.trim();
}

function assertOptionalIdempotencyKey(value: unknown): string | null | undefined {
  if (value === undefined || value === null) {
    return value === null ? null : undefined;
  }
  if (typeof value !== 'string' || value.trim().length < 8 || value.trim().length > 128) {
    throw new Error('INVALID_IDEMPOTENCY_KEY');
  }
  return value.trim();
}

export function validateIssueBillingDocumentInput(input: unknown): IssueBillingDocumentInput {
  if (!input || typeof input !== 'object') {
    throw new Error('INVALID_INPUT');
  }
  const body = input as Record<string, unknown>;
  return {
    dueDate: assertOptionalIsoDate(body.dueDate, 'due_date'),
    idempotencyKey: assertOptionalIdempotencyKey(body.idempotencyKey),
  };
}

export function validateCancelBillingDocumentInput(input: unknown): CancelBillingDocumentInput {
  if (!input || typeof input !== 'object') {
    throw new Error('INVALID_INPUT');
  }
  const body = input as Record<string, unknown>;
  if (typeof body.rowVersion !== 'number' || !Number.isInteger(body.rowVersion) || body.rowVersion < 1) {
    throw new Error('INVALID_ROW_VERSION');
  }
  if (typeof body.cancelReason !== 'string' || body.cancelReason.trim().length < 3) {
    throw new Error('INVALID_CANCEL_REASON');
  }
  return {
    rowVersion: body.rowVersion,
    cancelReason: body.cancelReason.trim(),
    idempotencyKey: assertOptionalIdempotencyKey(body.idempotencyKey),
  };
}

export function validateReplaceBillingDocumentInput(input: unknown): ReplaceBillingDocumentInput {
  if (!input || typeof input !== 'object') {
    throw new Error('INVALID_INPUT');
  }
  const body = input as Record<string, unknown>;
  if (typeof body.rowVersion !== 'number' || !Number.isInteger(body.rowVersion) || body.rowVersion < 1) {
    throw new Error('INVALID_ROW_VERSION');
  }
  if (typeof body.replaceReason !== 'string' || body.replaceReason.trim().length < 3) {
    throw new Error('INVALID_REPLACE_REASON');
  }
  return {
    dueDate: assertOptionalIsoDate(body.dueDate, 'due_date'),
    rowVersion: body.rowVersion,
    replaceReason: body.replaceReason.trim(),
    idempotencyKey: assertOptionalIdempotencyKey(body.idempotencyKey),
  };
}
