import type { ServiceOrderServiceSnapshot } from '../../service-orders/domain/service-order-snapshot';
import {
  assertCommercialReferencePresent,
  assertMeasurementHasItems,
  assertSeparationOfDuties,
  assertServiceOrderEligibleForMeasurement,
  MeasurementError,
  type MeasurementCommercialReferenceSnapshot,
} from './measurement';
import {
  assertMeasuredQuantityScale,
  assertMeasuredQuantityWithinAuthorizedBounds,
  compareMeasuredQuantities,
  normalizeMeasuredQuantity,
} from './measurement-quantity';

export class MeasurementValidationError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export type RowVersionCommandInput = {
  rowVersion: number;
  idempotencyKey?: string;
};

export type RejectMeasurementInput = RowVersionCommandInput & {
  rejectionReason: string;
};

export type UpdateMeasurementItemInput = RowVersionCommandInput & {
  measuredQuantity: string;
};

export type AuthorizeMeasurementAdjustmentInput = RowVersionCommandInput & {
  measurementItemId: string;
  adjustmentQuantity: string;
  reason: string;
};

function parseOptionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new MeasurementValidationError('VALIDATION_FAILED');
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseRequiredString(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new MeasurementValidationError('VALIDATION_FAILED');
  }
  return value.trim();
}

function parseRowVersion(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new MeasurementValidationError('VALIDATION_FAILED');
  }
  return value;
}

export function validateRowVersionCommandInput(input: unknown): RowVersionCommandInput {
  if (!input || typeof input !== 'object') {
    throw new MeasurementValidationError('VALIDATION_FAILED');
  }
  const record = input as Record<string, unknown>;
  return {
    rowVersion: parseRowVersion(record.rowVersion),
    idempotencyKey: parseOptionalString(record.idempotencyKey),
  };
}

export function validateRejectMeasurementInput(input: unknown): RejectMeasurementInput {
  if (!input || typeof input !== 'object') {
    throw new MeasurementValidationError('VALIDATION_FAILED');
  }
  const record = input as Record<string, unknown>;
  return {
    ...validateRowVersionCommandInput(input),
    rejectionReason: parseRequiredString(record.rejectionReason),
  };
}

export function validateUpdateMeasurementItemInput(input: unknown): UpdateMeasurementItemInput {
  if (!input || typeof input !== 'object') {
    throw new MeasurementValidationError('VALIDATION_FAILED');
  }
  const record = input as Record<string, unknown>;
  return {
    rowVersion: parseRowVersion(record.rowVersion),
    measuredQuantity: parseRequiredString(record.measuredQuantity),
  };
}

export function validateAuthorizeMeasurementAdjustmentInput(
  input: unknown,
): AuthorizeMeasurementAdjustmentInput {
  if (!input || typeof input !== 'object') {
    throw new MeasurementValidationError('VALIDATION_FAILED');
  }
  const record = input as Record<string, unknown>;
  return {
    rowVersion: parseRowVersion(record.rowVersion),
    measurementItemId: parseRequiredString(record.measurementItemId),
    adjustmentQuantity: parseRequiredString(record.adjustmentQuantity),
    reason: parseRequiredString(record.reason),
  };
}

export function assertUnitAllowedInServiceSnapshot(
  snapshot: ServiceOrderServiceSnapshot,
  unitCode: string,
): void {
  const allowed = snapshot.allowedUnits.some((unit) => unit.unitCode === unitCode);
  if (!allowed) {
    throw new MeasurementError('UNIT_NOT_ALLOWED');
  }
}

export function assertSubmitPreconditions(input: {
  serviceOrderStatus: string;
  commercialSnapshot: MeasurementCommercialReferenceSnapshot | Record<string, unknown>;
  itemCount: number;
}): void {
  assertServiceOrderEligibleForMeasurement(input.serviceOrderStatus);
  assertCommercialReferencePresent(input.commercialSnapshot);
  assertMeasurementHasItems(input.itemCount);
}

export function assertApprovePreconditions(input: {
  commercialSnapshot: MeasurementCommercialReferenceSnapshot | Record<string, unknown>;
  itemCount: number;
  submittedByIdentityId: string | null;
  decidedByIdentityId: string;
}): void {
  assertCommercialReferencePresent(input.commercialSnapshot);
  assertMeasurementHasItems(input.itemCount);
  assertSeparationOfDuties(input.submittedByIdentityId, input.decidedByIdentityId);
}

export function validateItemMeasuredQuantity(input: {
  measuredQuantity: string;
  actualQuantity: string;
  authorizedAdjustmentTotal: string;
  unitCode: string;
  unitDecimalScale: number;
  serviceSnapshot: ServiceOrderServiceSnapshot;
}): string {
  assertUnitAllowedInServiceSnapshot(input.serviceSnapshot, input.unitCode);
  const normalized = normalizeMeasuredQuantity(input.measuredQuantity);
  assertMeasuredQuantityScale(normalized, input.unitDecimalScale);
  assertMeasuredQuantityWithinAuthorizedBounds({
    actualQuantity: input.actualQuantity,
    measuredQuantity: normalized,
    authorizedAdjustmentTotal: input.authorizedAdjustmentTotal,
  });
  return normalized;
}

export function validateAdjustmentQuantity(input: {
  adjustmentQuantity: string;
  unitCode: string;
  itemUnitCode: string;
  unitDecimalScale: number;
}): string {
  if (input.unitCode !== input.itemUnitCode) {
    throw new MeasurementError('UNIT_MISMATCH');
  }
  const normalized = normalizeMeasuredQuantity(input.adjustmentQuantity);
  if (compareMeasuredQuantities(normalized, '0') <= 0) {
    throw new MeasurementError('INVALID_ADJUSTMENT_QUANTITY');
  }
  assertMeasuredQuantityScale(normalized, input.unitDecimalScale);
  return normalized;
}
