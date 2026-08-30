import { describe, expect, it, vi } from 'vitest';
import {
  INTEGRATION_ERROR_CLASSES,
  IntegrationProviderError,
} from '../domain/integration-error';
import { executeProviderCall } from './provider-executor';
import type { ProviderExecutorConfig } from './provider-executor.config';

const fastConfig: ProviderExecutorConfig = {
  defaultTimeoutMs: 100,
  maxRetryAttempts: 2,
  retryBaseDelayMs: 1,
  retryMaxDelayMs: 5,
  circuitBreakerFailureThreshold: 5,
  circuitBreakerResetTimeoutMs: 1_000,
};

describe('executeProviderCall', () => {
  it('enforces mandatory timeout', async () => {
    await expect(
      executeProviderCall(
        {
          operationName: 'SLOW_OP',
          timeoutMs: 20,
          retry: false,
          fn: async () => {
            await new Promise((resolve) => setTimeout(resolve, 80));
            return 'late';
          },
        },
        fastConfig,
      ),
    ).rejects.toMatchObject({
      errorClass: INTEGRATION_ERROR_CLASSES.Timeout,
    });
  });

  it('retries only retryable integration errors', async () => {
    const fn = vi.fn(async (): Promise<string> => {
      if (fn.mock.calls.length === 1) {
        throw new IntegrationProviderError(INTEGRATION_ERROR_CLASSES.Transient, 'TEMP_DOWN');
      }
      return 'ok';
    });

    const result = await executeProviderCall(
      {
        operationName: 'RETRYABLE_OP',
        retry: true,
        fn: async () => fn(),
      },
      fastConfig,
    );

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not retry permanent integration errors', async () => {
    const fn = vi.fn(async (): Promise<string> => {
      throw new IntegrationProviderError(INTEGRATION_ERROR_CLASSES.Permanent, 'NO_RETRY');
    });

    await expect(
      executeProviderCall(
        {
          operationName: 'PERMANENT_OP',
          retry: true,
          fn: async () => fn(),
        },
        fastConfig,
      ),
    ).rejects.toMatchObject({
      errorClass: INTEGRATION_ERROR_CLASSES.Permanent,
    });

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
