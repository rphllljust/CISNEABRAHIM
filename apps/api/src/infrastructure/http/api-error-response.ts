import type { ApiErrorResponse } from './api-error.types';

export function parseApiErrorResponse(body: string): ApiErrorResponse {
  const parsed = JSON.parse(body) as ApiErrorResponse;
  if (!parsed?.error || typeof parsed.error.code !== 'string') {
    throw new Error('Invalid API error response envelope.');
  }
  return parsed;
}

export function parseApiErrorCode(body: string): string {
  return parseApiErrorResponse(body).error.code;
}