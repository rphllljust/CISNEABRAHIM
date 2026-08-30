import { describe, expect, it } from 'vitest';
import { INTEGRATION_ERROR_CLASSES } from '../../domain/integration-error';
import { mapDygnusHttpError } from './dygnus-error.mapper';

describe('dygnus-error.mapper', () => {
  it('classifies vendor HTTP statuses into integration error classes', () => {
    expect(mapDygnusHttpError({ status: 401, body: {} }).errorClass).toBe(
      INTEGRATION_ERROR_CLASSES.Authentication,
    );
    expect(mapDygnusHttpError({ status: 403, body: {} }).errorClass).toBe(
      INTEGRATION_ERROR_CLASSES.Authorization,
    );
    expect(mapDygnusHttpError({ status: 429, body: {} }).errorClass).toBe(
      INTEGRATION_ERROR_CLASSES.RateLimit,
    );
    expect(mapDygnusHttpError({ status: 422, body: {} }).errorClass).toBe(
      INTEGRATION_ERROR_CLASSES.InvalidPayload,
    );
    expect(mapDygnusHttpError({ status: 503, body: {} }).errorClass).toBe(
      INTEGRATION_ERROR_CLASSES.Transient,
    );
  });
});
