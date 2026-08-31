import { HttpStatus } from '@nestjs/common';
import { MeasurementError } from '../domain/measurement';
import { MEASUREMENTS_ERROR_CODES } from '../errors/measurements-error-codes';
import { MeasurementsHttpException } from '../errors/measurements-http.exception';

export function measurementsAccessDenied(): MeasurementsHttpException {
  return new MeasurementsHttpException(
    HttpStatus.FORBIDDEN,
    MEASUREMENTS_ERROR_CODES.DENIED,
    'Access denied.',
  );
}

export function measurementsAccessNotFound(): MeasurementsHttpException {
  return new MeasurementsHttpException(
    HttpStatus.NOT_FOUND,
    MEASUREMENTS_ERROR_CODES.NOT_FOUND,
    'Measurement not found.',
  );
}

export function measurementsServiceOrderNotFound(): MeasurementsHttpException {
  return new MeasurementsHttpException(
    HttpStatus.NOT_FOUND,
    MEASUREMENTS_ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
    'Service order not found.',
  );
}

export function measurementsItemNotFound(): MeasurementsHttpException {
  return new MeasurementsHttpException(
    HttpStatus.NOT_FOUND,
    MEASUREMENTS_ERROR_CODES.ITEM_NOT_FOUND,
    'Measurement item not found.',
  );
}

export function measurementsValidationFailed(): MeasurementsHttpException {
  return new MeasurementsHttpException(
    HttpStatus.BAD_REQUEST,
    MEASUREMENTS_ERROR_CODES.VALIDATION_FAILED,
    'Invalid request body.',
  );
}

export function measurementsInvalidState(): MeasurementsHttpException {
  return new MeasurementsHttpException(
    HttpStatus.CONFLICT,
    MEASUREMENTS_ERROR_CODES.INVALID_STATE,
    'Measurement is not in a valid state for this operation.',
  );
}

export function measurementsVersionConflict(): MeasurementsHttpException {
  return new MeasurementsHttpException(
    HttpStatus.CONFLICT,
    MEASUREMENTS_ERROR_CODES.VERSION_CONFLICT,
    'Measurement was updated by another request.',
  );
}

export function measurementsNotEditable(): MeasurementsHttpException {
  return new MeasurementsHttpException(
    HttpStatus.CONFLICT,
    MEASUREMENTS_ERROR_CODES.NOT_EDITABLE,
    'Measurement is not editable.',
  );
}

export function measurementsAlreadyExists(): MeasurementsHttpException {
  return new MeasurementsHttpException(
    HttpStatus.CONFLICT,
    MEASUREMENTS_ERROR_CODES.MEASUREMENT_ALREADY_EXISTS,
    'An active measurement already exists for this service order.',
  );
}

export function mapMeasurementDomainError(error: MeasurementError): MeasurementsHttpException {
  const codeMap: Record<string, (typeof MEASUREMENTS_ERROR_CODES)[keyof typeof MEASUREMENTS_ERROR_CODES]> = {
    SERVICE_ORDER_NOT_COMPLETED: MEASUREMENTS_ERROR_CODES.SERVICE_ORDER_NOT_COMPLETED,
    COMMERCIAL_REFERENCE_MISSING: MEASUREMENTS_ERROR_CODES.COMMERCIAL_REFERENCE_MISSING,
    MEASUREMENT_ITEMS_REQUIRED: MEASUREMENTS_ERROR_CODES.MEASUREMENT_ITEMS_REQUIRED,
    UNIT_NOT_ALLOWED: MEASUREMENTS_ERROR_CODES.UNIT_NOT_ALLOWED,
    UNIT_MISMATCH: MEASUREMENTS_ERROR_CODES.UNIT_MISMATCH,
    INVALID_MEASURED_QUANTITY: MEASUREMENTS_ERROR_CODES.INVALID_MEASURED_QUANTITY,
    QUANTITY_PRECISION_EXCEEDED: MEASUREMENTS_ERROR_CODES.QUANTITY_PRECISION_EXCEEDED,
    MEASUREMENT_DIVERGENCE_NOT_AUTHORIZED: MEASUREMENTS_ERROR_CODES.MEASUREMENT_DIVERGENCE_NOT_AUTHORIZED,
    INVALID_ADJUSTMENT_QUANTITY: MEASUREMENTS_ERROR_CODES.INVALID_ADJUSTMENT_QUANTITY,
    SEPARATION_OF_DUTIES_VIOLATION: MEASUREMENTS_ERROR_CODES.SEPARATION_OF_DUTIES_VIOLATION,
  };
  const code = codeMap[error.code] ?? MEASUREMENTS_ERROR_CODES.VALIDATION_FAILED;
  const status =
    error.code === 'MEASUREMENT_DIVERGENCE_NOT_AUTHORIZED'
      ? HttpStatus.CONFLICT
      : HttpStatus.BAD_REQUEST;
  return new MeasurementsHttpException(status, code, error.code);
}
