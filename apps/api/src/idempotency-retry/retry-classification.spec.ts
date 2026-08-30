import { describe, expect, it, vi } from 'vitest';
import {
  INTEGRATION_ERROR_CLASSES,
  isRetryableIntegrationError,
} from '../integrations/acl/domain/integration-error';
import { executeProviderCall } from '../integrations/acl/resilience/provider-executor';
import { PermanentJobError, TransientJobError, classifyJobError } from '../platform/background-jobs/domain/job-errors';
import { INTEGRATION_INBOX_ERROR_CLASSES } from '../integrations/inbox/domain/inbox-status';
import {
  classifyInboxError,
  InvalidInboxPayloadError,
  PermanentInboxError,
  TransientInboxError,
} from '../integrations/inbox/domain/inbox-errors';

function isInboxRetryable(errorClass: ReturnType<typeof classifyInboxError>): boolean {
  return errorClass === INTEGRATION_INBOX_ERROR_CLASSES.Transient;
}

describe('Retry classification (semantic safety)', () => {
  it('retries only transient integration provider errors', () => {
    expect(isRetryableIntegrationError(INTEGRATION_ERROR_CLASSES.Transient)).toBe(true);
    expect(isRetryableIntegrationError(INTEGRATION_ERROR_CLASSES.Timeout)).toBe(true);
    expect(isRetryableIntegrationError(INTEGRATION_ERROR_CLASSES.RateLimit)).toBe(true);
    expect(isRetryableIntegrationError(INTEGRATION_ERROR_CLASSES.Authentication)).toBe(false);
    expect(isRetryableIntegrationError(INTEGRATION_ERROR_CLASSES.Authorization)).toBe(false);
    expect(isRetryableIntegrationError(INTEGRATION_ERROR_CLASSES.InvalidPayload)).toBe(false);
    expect(isRetryableIntegrationError(INTEGRATION_ERROR_CLASSES.Permanent)).toBe(false);
  });

  it('classifies background job failures without infinite transient retry on permanent errors', () => {
    expect(classifyJobError(new TransientJobError('timeout'))).toBe('TRANSIENT');
    expect(classifyJobError(new PermanentJobError('bad payload'))).toBe('PERMANENT');
    expect(classifyJobError(new Error('unknown'))).toBe('TRANSIENT');
  });

  it('retries inbox processing only for transient inbox errors', () => {
    expect(isInboxRetryable(classifyInboxError(new TransientInboxError('db')))).toBe(true);
    expect(isInboxRetryable(classifyInboxError(new PermanentInboxError('poison')))).toBe(false);
    expect(isInboxRetryable(classifyInboxError(new InvalidInboxPayloadError('schema')))).toBe(false);
    expect(isInboxRetryable(classifyInboxError(new Error('unknown')))).toBe(true);
  });

  it('caps provider retry attempts for non-retryable failures', async () => {
    const fn = vi.fn(async (): Promise<string> => {
      throw new Error('503');
    });

    await expect(
      executeProviderCall(
        {
          operationName: 'RETRY_CAP',
          retry: true,
          fn: async () => fn(),
        },
        {
          defaultTimeoutMs: 50,
          maxRetryAttempts: 2,
          retryBaseDelayMs: 1,
          retryMaxDelayMs: 2,
          circuitBreakerFailureThreshold: 100,
          circuitBreakerResetTimeoutMs: 1,
        },
      ),
    ).rejects.toBeTruthy();

    expect(fn.mock.calls.length).toBe(3);
  });
});
