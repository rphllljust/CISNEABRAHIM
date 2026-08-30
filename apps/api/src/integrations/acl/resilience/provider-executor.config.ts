export type ProviderExecutorConfig = {
  defaultTimeoutMs: number;
  maxRetryAttempts: number;
  retryBaseDelayMs: number;
  retryMaxDelayMs: number;
  circuitBreakerFailureThreshold: number;
  circuitBreakerResetTimeoutMs: number;
};

export function loadProviderExecutorConfig(): ProviderExecutorConfig {
  return {
    defaultTimeoutMs: parsePositiveInt(process.env['INTEGRATION_PROVIDER_TIMEOUT_MS'], 10_000),
    maxRetryAttempts: parsePositiveInt(process.env['INTEGRATION_PROVIDER_MAX_RETRIES'], 2),
    retryBaseDelayMs: parsePositiveInt(process.env['INTEGRATION_PROVIDER_RETRY_BASE_MS'], 200),
    retryMaxDelayMs: parsePositiveInt(process.env['INTEGRATION_PROVIDER_RETRY_MAX_MS'], 2_000),
    circuitBreakerFailureThreshold: parsePositiveInt(
      process.env['INTEGRATION_CIRCUIT_BREAKER_FAILURE_THRESHOLD'],
      5,
    ),
    circuitBreakerResetTimeoutMs: parsePositiveInt(
      process.env['INTEGRATION_CIRCUIT_BREAKER_RESET_MS'],
      30_000,
    ),
  };
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

export function computeRetryDelayMs(
  attemptIndex: number,
  baseMs: number,
  maxMs: number,
): number {
  const exponent = Math.max(attemptIndex, 0);
  return Math.min(baseMs * 2 ** exponent, maxMs);
}
