import {
  validateRecordEvidenceInput,
  validateRecordMeasuredValueInput,
  validateRecordObservationInput,
  validateRecordOccurrenceInput,
  validateRecordQuantityInput,
} from '../domain/service-order-execution.validation';

function parseRecord(record: unknown): Record<string, unknown> {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new Error('VALIDATION_FAILED');
  }
  return record as Record<string, unknown>;
}

export function parseRecordQuantityInput(body: unknown) {
  return validateRecordQuantityInput(parseRecord(body));
}

export function parseRecordMeasuredValueInput(body: unknown) {
  return validateRecordMeasuredValueInput(parseRecord(body));
}

export function parseRecordObservationInput(body: unknown) {
  return validateRecordObservationInput(parseRecord(body));
}

export function parseRecordOccurrenceInput(body: unknown) {
  return validateRecordOccurrenceInput(parseRecord(body));
}

export function parseRecordEvidenceInput(body: unknown) {
  return validateRecordEvidenceInput(parseRecord(body));
}
