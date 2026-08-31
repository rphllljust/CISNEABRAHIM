import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ApiExceptionFilter } from './api-exception.filter';
import { COMMERCIAL_ERROR_CODES } from '../../commercial/errors/commercial-error-codes';
import { CommercialHttpException } from '../../commercial/errors/commercial-http.exception';

function createHost(statusCodeRef: { value: number }, bodyRef: { value: unknown }) {
  const send = vi.fn((body: unknown) => {
    bodyRef.value = body;
    return undefined;
  });
  const status = vi.fn((code: number) => {
    statusCodeRef.value = code;
    return { send };
  });

  return {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ headers: { 'x-correlation-id': 'corr-filter-test' } }),
    }),
  };
}

describe('ApiExceptionFilter', () => {
  const filter = new ApiExceptionFilter();

  it.each([
    [HttpStatus.BAD_REQUEST, 'VALIDATION_FAILED'],
    [HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED'],
    [HttpStatus.FORBIDDEN, COMMERCIAL_ERROR_CODES.DENIED],
    [HttpStatus.NOT_FOUND, 'NOT_FOUND'],
    [HttpStatus.CONFLICT, 'VERSION_CONFLICT'],
    [HttpStatus.UNPROCESSABLE_ENTITY, 'UNPROCESSABLE_ENTITY'],
    [HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED'],
    [HttpStatus.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR'],
  ])('returns unified envelope for status %i', (status, expectedCode) => {
    const statusRef = { value: 0 };
    const bodyRef = { value: undefined as unknown };
    const exception =
      status === HttpStatus.FORBIDDEN
        ? new CommercialHttpException(status, COMMERCIAL_ERROR_CODES.DENIED, 'Access denied.')
        : new HttpException('raw', status);

    filter.catch(exception, createHost(statusRef, bodyRef) as never);

    expect(statusRef.value).toBe(status);
    const payload = bodyRef.value as { error: { code: string; message: string; correlationId: string } };
    expect(payload.error.code).toBe(expectedCode);
    expect(payload.error.correlationId).toBe('corr-filter-test');
    expect(JSON.stringify(payload)).not.toMatch(/stack|postgresql|node_modules/i);
  });
});