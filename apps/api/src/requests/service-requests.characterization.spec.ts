import { HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { REQUESTS_ERROR_CODES } from './errors/requests-error-codes';
import { RequestsHttpException } from './errors/requests-http.exception';
import {
  serviceRequestsAccessDenied,
  serviceRequestsAccessNotFound,
  serviceRequestsVersionConflict,
} from './services/service-requests-access.errors';
import { assertValidServiceRequestId } from './services/service-requests-input-resolution';

describe('Service requests characterization (unit)', () => {
  it('maps authz denial to FORBIDDEN DENIED', () => {
    const error = serviceRequestsAccessDenied();
    expect(error).toBeInstanceOf(RequestsHttpException);
    expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN);
    expect(error.getResponse()).toMatchObject({ error: { code: REQUESTS_ERROR_CODES.DENIED } });
  });

  it('maps missing service request to NOT_FOUND', () => {
    const error = serviceRequestsAccessNotFound();
    expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(error.getResponse()).toMatchObject({ error: { code: REQUESTS_ERROR_CODES.NOT_FOUND } });
  });

  it('maps optimistic concurrency to VERSION_CONFLICT', () => {
    const error = serviceRequestsVersionConflict();
    expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(error.getResponse()).toMatchObject({ error: { code: REQUESTS_ERROR_CODES.VERSION_CONFLICT } });
  });

  it('treats invalid service request UUID as not found without leaking validation detail', () => {
    expect(() => assertValidServiceRequestId('not-a-uuid')).toThrow(RequestsHttpException);
    try {
      assertValidServiceRequestId('not-a-uuid');
    } catch (error) {
      const httpError = error as RequestsHttpException;
      expect(httpError.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(httpError.getResponse()).toMatchObject({ error: { code: REQUESTS_ERROR_CODES.NOT_FOUND } });
    }
  });
});
