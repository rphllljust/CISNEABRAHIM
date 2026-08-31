import { HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ServiceOrderReleaseError } from './domain/service-order-release';
import { SERVICE_ORDERS_ERROR_CODES } from './errors/service-orders-error-codes';
import { ServiceOrdersHttpException } from './errors/service-orders-http.exception';
import {
  isServiceOrderUniqueViolation,
  isServiceRequestUniqueViolation,
} from './repositories/service-orders.repository.errors';
import {
  mapServiceOrderReleaseError,
  serviceOrdersAccessDenied,
  serviceOrdersAccessNotFound,
  serviceOrdersValidationFailed,
  serviceOrdersVersionConflict,
} from './services/service-orders-access.errors';
import { assertValidServiceOrderId } from './services/service-orders-input-resolution';

describe('Service orders characterization (unit)', () => {
  it('maps authz denial to FORBIDDEN DENIED', () => {
    const error = serviceOrdersAccessDenied();
    expect(error).toBeInstanceOf(ServiceOrdersHttpException);
    expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN);
    expect(error.getResponse()).toMatchObject({ code: SERVICE_ORDERS_ERROR_CODES.DENIED });
  });

  it('maps missing service order to NOT_FOUND', () => {
    const error = serviceOrdersAccessNotFound();
    expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(error.getResponse()).toMatchObject({ code: SERVICE_ORDERS_ERROR_CODES.NOT_FOUND });
  });

  it('maps optimistic concurrency to VERSION_CONFLICT', () => {
    const error = serviceOrdersVersionConflict();
    expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(error.getResponse()).toMatchObject({ code: SERVICE_ORDERS_ERROR_CODES.VERSION_CONFLICT });
  });

  it('maps validation failures to BAD_REQUEST VALIDATION_FAILED', () => {
    const error = serviceOrdersValidationFailed();
    expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(error.getResponse()).toMatchObject({ code: SERVICE_ORDERS_ERROR_CODES.VALIDATION_FAILED });
  });

  it('detects service request unique PostgreSQL violations', () => {
    expect(
      isServiceRequestUniqueViolation({ code: '23505', constraint: 'service_orders_service_request_id_uidx' }),
    ).toBe(true);
    expect(isServiceRequestUniqueViolation({ code: '23505', constraint: 'other_unique' })).toBe(false);
    expect(isServiceRequestUniqueViolation(null)).toBe(false);
  });

  it('detects generic unique PostgreSQL violations', () => {
    expect(isServiceOrderUniqueViolation({ code: '23505' })).toBe(true);
    expect(isServiceOrderUniqueViolation({ code: '23503' })).toBe(false);
  });

  it('treats invalid service order UUID as not found without leaking validation detail', () => {
    expect(() => assertValidServiceOrderId('not-a-uuid')).toThrow(ServiceOrdersHttpException);
    try {
      assertValidServiceOrderId('not-a-uuid');
    } catch (error) {
      const httpError = error as ServiceOrdersHttpException;
      expect(httpError.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(httpError.getResponse()).toMatchObject({ code: SERVICE_ORDERS_ERROR_CODES.NOT_FOUND });
    }
  });

  it('maps release precondition CLIENT_REQUIRED to CLIENT_REQUIRED conflict', () => {
    const error = mapServiceOrderReleaseError(new ServiceOrderReleaseError('CLIENT_REQUIRED'));
    expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(error.getResponse()).toMatchObject({ code: SERVICE_ORDERS_ERROR_CODES.CLIENT_REQUIRED });
  });
});
