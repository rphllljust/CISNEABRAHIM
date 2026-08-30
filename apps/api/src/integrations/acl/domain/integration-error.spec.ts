import { describe, expect, it } from 'vitest';
import {
  INTEGRATION_ERROR_CLASSES,
  IntegrationProviderError,
  classifyIntegrationError,
  isRetryableIntegrationError,
} from './integration-error';

describe('integration-error', () => {
  it('classifies provider errors by errorClass', () => {
    const error = new IntegrationProviderError(
      INTEGRATION_ERROR_CLASSES.Authentication,
      'AUTH_FAILED',
    );
    expect(classifyIntegrationError(error)).toBe(INTEGRATION_ERROR_CLASSES.Authentication);
  });

  it('classifies AbortError as timeout', () => {
    const error = new DOMException('aborted', 'AbortError');
    expect(classifyIntegrationError(error)).toBe(INTEGRATION_ERROR_CLASSES.Timeout);
  });

  it('marks only transient classes as retryable', () => {
    expect(isRetryableIntegrationError(INTEGRATION_ERROR_CLASSES.Transient)).toBe(true);
    expect(isRetryableIntegrationError(INTEGRATION_ERROR_CLASSES.Timeout)).toBe(true);
    expect(isRetryableIntegrationError(INTEGRATION_ERROR_CLASSES.RateLimit)).toBe(true);
    expect(isRetryableIntegrationError(INTEGRATION_ERROR_CLASSES.Authentication)).toBe(false);
    expect(isRetryableIntegrationError(INTEGRATION_ERROR_CLASSES.InvalidPayload)).toBe(false);
    expect(isRetryableIntegrationError(INTEGRATION_ERROR_CLASSES.Permanent)).toBe(false);
  });
});
