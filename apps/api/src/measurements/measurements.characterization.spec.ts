import { HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { MeasurementError } from './domain/measurement';
import { MEASUREMENTS_ERROR_CODES } from './errors/measurements-error-codes';
import { MeasurementsHttpException } from './errors/measurements-http.exception';
import {
  mapMeasurementDomainError,
  measurementsAccessDenied,
  measurementsAccessNotFound,
  measurementsVersionConflict,
} from './services/measurements-access.errors';
import { assertValidMeasurementId } from './services/measurements-input-resolution';

describe('Measurements characterization (unit)', () => {
  it('maps authz denial to FORBIDDEN DENIED', () => {
    const error = measurementsAccessDenied();
    expect(error).toBeInstanceOf(MeasurementsHttpException);
    expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN);
    expect(error.getResponse()).toMatchObject({ error: { code: MEASUREMENTS_ERROR_CODES.DENIED } });
  });

  it('maps missing measurement to NOT_FOUND', () => {
    const error = measurementsAccessNotFound();
    expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(error.getResponse()).toMatchObject({ error: { code: MEASUREMENTS_ERROR_CODES.NOT_FOUND } });
  });

  it('maps optimistic concurrency to VERSION_CONFLICT', () => {
    const error = measurementsVersionConflict();
    expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(error.getResponse()).toMatchObject({ error: { code: MEASUREMENTS_ERROR_CODES.VERSION_CONFLICT } });
  });

  it('maps domain divergence errors to CONFLICT', () => {
    const error = mapMeasurementDomainError(new MeasurementError('MEASUREMENT_DIVERGENCE_NOT_AUTHORIZED'));
    expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(error.getResponse()).toMatchObject({
      error: { code: MEASUREMENTS_ERROR_CODES.MEASUREMENT_DIVERGENCE_NOT_AUTHORIZED },
    });
  });

  it('treats invalid measurement UUID as not found without leaking validation detail', () => {
    expect(() => assertValidMeasurementId('not-a-uuid')).toThrow(MeasurementsHttpException);
    try {
      assertValidMeasurementId('not-a-uuid');
    } catch (error) {
      const httpError = error as MeasurementsHttpException;
      expect(httpError.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(httpError.getResponse()).toMatchObject({ error: { code: MEASUREMENTS_ERROR_CODES.NOT_FOUND } });
    }
  });
});
