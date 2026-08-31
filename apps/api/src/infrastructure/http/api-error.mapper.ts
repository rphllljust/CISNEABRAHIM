import { sanitizeHttpExceptionMessage } from '../../security/domain/safe-error-message';
import type { ApiErrorBody, ApiErrorResponse } from './api-error.types';

type FlatErrorBody = {
  code?: unknown;
  message?: unknown;
};

type NestedErrorBody = {
  error?: {
    code?: unknown;
    message?: unknown;
    correlationId?: unknown;
    stack?: unknown;
  };
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function extractCodeAndMessage(body: unknown): { code: string; message: string } | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const nested = body as NestedErrorBody;
  if (nested.error && typeof nested.error === 'object') {
    const code = nested.error.code;
    const message = nested.error.message;
    if (isNonEmptyString(code) && isNonEmptyString(message)) {
      return { code, message };
    }
  }

  const flat = body as FlatErrorBody;
  if (isNonEmptyString(flat.code) && isNonEmptyString(flat.message)) {
    return { code: flat.code, message: flat.message };
  }

  return null;
}

function defaultCodeForStatus(status: number): string {
  if (status === 400) {
    return 'VALIDATION_FAILED';
  }
  if (status === 401) {
    return 'UNAUTHORIZED';
  }
  if (status === 403) {
    return 'DENIED';
  }
  if (status === 404) {
    return 'NOT_FOUND';
  }
  if (status === 409) {
    return 'VERSION_CONFLICT';
  }
  if (status === 422) {
    return 'UNPROCESSABLE_ENTITY';
  }
  if (status === 429) {
    return 'RATE_LIMIT_EXCEEDED';
  }
  return status >= 500 ? 'INTERNAL_ERROR' : 'HTTP_ERROR';
}

function defaultMessageForStatus(status: number): string {
  if (status === 400) {
    return 'Request validation failed.';
  }
  if (status === 401) {
    return 'Authentication required.';
  }
  if (status === 403) {
    return 'Access denied.';
  }
  if (status === 404) {
    return 'Resource not found.';
  }
  if (status === 409) {
    return 'Resource conflict.';
  }
  if (status === 422) {
    return 'Request could not be processed.';
  }
  if (status === 429) {
    return 'Too many requests. Try again later.';
  }
  return status >= 500 ? 'Internal server error.' : 'Request failed.';
}

export function buildDomainHttpExceptionBody(code: string, message: string): { error: { code: string; message: string } } {
  return { error: { code, message } };
}

export function mapHttpExceptionToApiErrorResponse(
  body: unknown,
  status: number,
  correlationId: string,
): ApiErrorResponse {
  const extracted = extractCodeAndMessage(body);
  const code = extracted?.code ?? defaultCodeForStatus(status);
  const rawMessage = extracted?.message ?? (typeof body === 'string' ? body : defaultMessageForStatus(status));
  const message = sanitizeHttpExceptionMessage(rawMessage, status);

  const apiBody: ApiErrorBody = {
    code,
    message,
    correlationId,
  };

  return { error: apiBody };
}