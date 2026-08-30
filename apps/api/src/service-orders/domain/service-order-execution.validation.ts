import { assertUuid, CatalogValidationError } from '../../catalog/domain/service-catalog.validation';
import {
  EXECUTION_ENTRY_TYPES,
  type ExecutionEntryType,
  type ExecutionEvidenceKind,
  isRecognizedExecutionEvidenceKind,
} from './service-order-execution';

export class ServiceOrderExecutionValidationError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export type RowVersionCommandInput = {
  rowVersion: number;
  idempotencyKey?: string;
};

export type RecordQuantityInput = RowVersionCommandInput & {
  quantityValue: string;
  unitCode: string;
  context?: Record<string, unknown>;
};

export type RecordMeasuredValueInput = RowVersionCommandInput & {
  value: string;
  context?: Record<string, unknown>;
};

export type RecordObservationInput = RowVersionCommandInput & {
  text: string;
  context?: Record<string, unknown>;
};

export type RecordOccurrenceInput = RowVersionCommandInput & {
  occurrenceCode: string;
  description: string;
  payload?: Record<string, unknown>;
};

export type RecordEvidenceInput = RowVersionCommandInput & {
  evidenceKind: ExecutionEvidenceKind;
  payload: Record<string, unknown>;
};

function parseOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new ServiceOrderExecutionValidationError('VALIDATION_FAILED');
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseRequiredString(value: unknown, _field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ServiceOrderExecutionValidationError('VALIDATION_FAILED');
  }
  return value.trim();
}

function parseRowVersion(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new ServiceOrderExecutionValidationError('VALIDATION_FAILED');
  }
  return value;
}

function parseContext(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new ServiceOrderExecutionValidationError('VALIDATION_FAILED');
  }
  return value as Record<string, unknown>;
}

function parseDecimalString(value: unknown, field: string): string {
  const raw = parseRequiredString(value, field);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new ServiceOrderExecutionValidationError('VALIDATION_FAILED');
  }
  return raw;
}

export function validateRowVersionCommandInput(input: unknown): RowVersionCommandInput {
  if (!input || typeof input !== 'object') {
    throw new ServiceOrderExecutionValidationError('VALIDATION_FAILED');
  }
  const record = input as Record<string, unknown>;
  return {
    rowVersion: parseRowVersion(record.rowVersion),
    idempotencyKey: parseOptionalString(record.idempotencyKey),
  };
}

export function validateRecordQuantityInput(input: unknown): RecordQuantityInput {
  if (!input || typeof input !== 'object') {
    throw new ServiceOrderExecutionValidationError('VALIDATION_FAILED');
  }
  const record = input as Record<string, unknown>;
  const base = validateRowVersionCommandInput(record);
  return {
    ...base,
    quantityValue: parseDecimalString(record.quantityValue, 'quantityValue'),
    unitCode: parseRequiredString(record.unitCode, 'unitCode'),
    context: parseContext(record.context),
  };
}

export function validateRecordMeasuredValueInput(input: unknown): RecordMeasuredValueInput {
  if (!input || typeof input !== 'object') {
    throw new ServiceOrderExecutionValidationError('VALIDATION_FAILED');
  }
  const record = input as Record<string, unknown>;
  const base = validateRowVersionCommandInput(record);
  return {
    ...base,
    value: parseDecimalString(record.value, 'value'),
    context: parseContext(record.context),
  };
}

export function validateRecordObservationInput(input: unknown): RecordObservationInput {
  if (!input || typeof input !== 'object') {
    throw new ServiceOrderExecutionValidationError('VALIDATION_FAILED');
  }
  const record = input as Record<string, unknown>;
  const base = validateRowVersionCommandInput(record);
  return {
    ...base,
    text: parseRequiredString(record.text, 'text'),
    context: parseContext(record.context),
  };
}

export function validateRecordOccurrenceInput(input: unknown): RecordOccurrenceInput {
  if (!input || typeof input !== 'object') {
    throw new ServiceOrderExecutionValidationError('VALIDATION_FAILED');
  }
  const record = input as Record<string, unknown>;
  const base = validateRowVersionCommandInput(record);
  return {
    ...base,
    occurrenceCode: parseRequiredString(record.occurrenceCode, 'occurrenceCode'),
    description: parseRequiredString(record.description, 'description'),
    payload: parseContext(record.payload),
  };
}

export function validateRecordEvidenceInput(input: unknown): RecordEvidenceInput {
  if (!input || typeof input !== 'object') {
    throw new ServiceOrderExecutionValidationError('VALIDATION_FAILED');
  }
  const record = input as Record<string, unknown>;
  const base = validateRowVersionCommandInput(record);
  const evidenceKind = parseRequiredString(record.evidenceKind, 'evidenceKind');
  if (!isRecognizedExecutionEvidenceKind(evidenceKind)) {
    throw new ServiceOrderExecutionValidationError('VALIDATION_FAILED');
  }
  const payload = parseContext(record.payload);
  if (!payload) {
    throw new ServiceOrderExecutionValidationError('VALIDATION_FAILED');
  }
  return {
    ...base,
    evidenceKind,
    payload,
  };
}

export function assertValidServiceOrderId(serviceOrderId: string): void {
  try {
    assertUuid(serviceOrderId, 'serviceOrderId');
  } catch (error) {
    if (error instanceof CatalogValidationError) {
      throw new ServiceOrderExecutionValidationError('VALIDATION_FAILED');
    }
    throw error;
  }
}

export function toExecutionEntryType(value: ExecutionEntryType): ExecutionEntryType {
  if (!Object.values(EXECUTION_ENTRY_TYPES).includes(value)) {
    throw new ServiceOrderExecutionValidationError('VALIDATION_FAILED');
  }
  return value;
}
