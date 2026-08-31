import { HttpException, HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { CommercialHttpException } from '../../commercial/errors/commercial-http.exception';
import { COMMERCIAL_ERROR_CODES } from '../../commercial/errors/commercial-error-codes';
import { ClientHttpException } from '../../clients/errors/client-http.exception';
import { CLIENT_ERROR_CODES } from '../../clients/errors/client-error-codes';
import { mapHttpExceptionToApiErrorResponse } from './api-error.mapper';

describe('mapHttpExceptionToApiErrorResponse', () => {
  const correlationId = 'corr-test-123';

  it('normalizes flat domain errors', () => {
    const exception = new CommercialHttpException(
      HttpStatus.FORBIDDEN,
      COMMERCIAL_ERROR_CODES.DENIED,
      'Access denied.',
    );
    const response = mapHttpExceptionToApiErrorResponse(
      exception.getResponse(),
      exception.getStatus(),
      correlationId,
    );
    expect(response).toEqual({
      error: {
        code: COMMERCIAL_ERROR_CODES.DENIED,
        message: 'Access denied.',
        correlationId,
      },
    });
  });

  it('preserves nested domain errors', () => {
    const exception = new ClientHttpException(
      HttpStatus.NOT_FOUND,
      CLIENT_ERROR_CODES.NOT_FOUND,
      'Client not found.',
    );
    const response = mapHttpExceptionToApiErrorResponse(
      exception.getResponse(),
      exception.getStatus(),
      correlationId,
    );
    expect(response.error.code).toBe(CLIENT_ERROR_CODES.NOT_FOUND);
    expect(response.error.correlationId).toBe(correlationId);
  });

  it('sanitizes 5xx messages', () => {
    const exception = new HttpException('postgresql://secret', HttpStatus.INTERNAL_SERVER_ERROR);
    const response = mapHttpExceptionToApiErrorResponse(
      exception.getResponse(),
      exception.getStatus(),
      correlationId,
    );
    expect(response.error.message).toBe('Internal server error.');
    expect(response.error.message).not.toContain('postgresql');
  });

  it('maps status codes to default codes', () => {
    expect(
      mapHttpExceptionToApiErrorResponse('bad', HttpStatus.BAD_REQUEST, correlationId).error.code,
    ).toBe('VALIDATION_FAILED');
    expect(
      mapHttpExceptionToApiErrorResponse('denied', HttpStatus.FORBIDDEN, correlationId).error.code,
    ).toBe('DENIED');
    expect(
      mapHttpExceptionToApiErrorResponse('missing', HttpStatus.NOT_FOUND, correlationId).error.code,
    ).toBe('NOT_FOUND');
    expect(
      mapHttpExceptionToApiErrorResponse('conflict', HttpStatus.CONFLICT, correlationId).error.code,
    ).toBe('VERSION_CONFLICT');
    expect(
      mapHttpExceptionToApiErrorResponse('invalid', HttpStatus.UNPROCESSABLE_ENTITY, correlationId).error.code,
    ).toBe('UNPROCESSABLE_ENTITY');
    expect(
      mapHttpExceptionToApiErrorResponse('limit', HttpStatus.TOO_MANY_REQUESTS, correlationId).error.code,
    ).toBe('RATE_LIMIT_EXCEEDED');
  });
});