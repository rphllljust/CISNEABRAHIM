import {
  INTEGRATION_ERROR_CLASSES,
  IntegrationProviderError,
  isIntegrationProviderError,
  isRetryableIntegrationError,
} from '../domain/integration-error';
import { CircuitBreaker } from './circuit-breaker';
import {
  computeRetryDelayMs,
  loadProviderExecutorConfig,
  type ProviderExecutorConfig,
} from './provider-executor.config';

export type ProviderCallOptions<T> = {
  operationName: string;
  timeoutMs?: number;
  signal?: AbortSignal;
  retry?: boolean;
  circuitBreaker?: CircuitBreaker;
  fn: (signal: AbortSignal) => Promise<T>;
};

function mergeAbortSignals(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new IntegrationProviderError(
          INTEGRATION_ERROR_CLASSES.Timeout,
          `${operationName}_TIMEOUT_AFTER_${timeoutMs}ms`,
        ),
      );
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        if (error instanceof Error) {
          reject(error);
          return;
        }
        reject(
          new IntegrationProviderError(
            INTEGRATION_ERROR_CLASSES.Transient,
            `${operationName}_UNKNOWN_FAILURE`,
          ),
        );
      });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function executeProviderCall<T>(
  options: ProviderCallOptions<T>,
  config: ProviderExecutorConfig = loadProviderExecutorConfig(),
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? config.defaultTimeoutMs;
  const retryEnabled = options.retry ?? true;
  const maxAttempts = retryEnabled ? config.maxRetryAttempts + 1 : 1;

  options.circuitBreaker?.assertCallAllowed();

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const timeoutController = new AbortController();
    const signals = [timeoutController.signal];
    if (options.signal) {
      signals.push(options.signal);
    }
    const mergedSignal = mergeAbortSignals(signals);

    try {
      const result = await withTimeout(
        options.fn(mergedSignal),
        timeoutMs,
        options.operationName,
      );
      options.circuitBreaker?.recordSuccess();
      return result;
    } catch (error) {
      lastError = normalizeProviderError(error, options.operationName);
      options.circuitBreaker?.recordFailure();

      const errorClass = isIntegrationProviderError(lastError)
        ? lastError.errorClass
        : INTEGRATION_ERROR_CLASSES.Transient;

      const canRetry = retryEnabled && isRetryableIntegrationError(errorClass);
      const isLastAttempt = attempt >= maxAttempts - 1;
      if (!canRetry || isLastAttempt) {
        throw lastError;
      }

      const delayMs = computeRetryDelayMs(
        attempt,
        config.retryBaseDelayMs,
        config.retryMaxDelayMs,
      );
      await sleep(delayMs);
    }
  }

  throw lastError;
}

function normalizeProviderError(error: unknown, operationName: string): unknown {
  if (isIntegrationProviderError(error)) {
    return error;
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return new IntegrationProviderError(
      INTEGRATION_ERROR_CLASSES.Timeout,
      `${operationName}_ABORTED`,
      { cause: error },
    );
  }
  if (error instanceof Error) {
    return new IntegrationProviderError(INTEGRATION_ERROR_CLASSES.Transient, error.message, {
      cause: error,
    });
  }
  return new IntegrationProviderError(
    INTEGRATION_ERROR_CLASSES.Transient,
    `${operationName}_UNKNOWN_FAILURE`,
  );
}
