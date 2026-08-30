export const INTEGRATION_ERROR_CLASSES = {
  Authentication: 'AUTHENTICATION',
  Authorization: 'AUTHORIZATION',
  RateLimit: 'RATE_LIMIT',
  Transient: 'TRANSIENT',
  Timeout: 'TIMEOUT',
  InvalidPayload: 'INVALID_PAYLOAD',
  Permanent: 'PERMANENT',
} as const;

export type IntegrationErrorClass =
  (typeof INTEGRATION_ERROR_CLASSES)[keyof typeof INTEGRATION_ERROR_CLASSES];

export class IntegrationProviderError extends Error {
  readonly errorClass: IntegrationErrorClass;
  readonly vendorDetail?: string;

  constructor(
    errorClass: IntegrationErrorClass,
    message: string,
    options?: { vendorDetail?: string; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = 'IntegrationProviderError';
    this.errorClass = errorClass;
    this.vendorDetail = options?.vendorDetail;
  }
}

export function isIntegrationProviderError(error: unknown): error is IntegrationProviderError {
  return error instanceof IntegrationProviderError;
}

export function classifyIntegrationError(error: unknown): IntegrationErrorClass {
  if (error instanceof IntegrationProviderError) {
    return error.errorClass;
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return INTEGRATION_ERROR_CLASSES.Timeout;
  }
  return INTEGRATION_ERROR_CLASSES.Transient;
}

export function isRetryableIntegrationError(errorClass: IntegrationErrorClass): boolean {
  return (
    errorClass === INTEGRATION_ERROR_CLASSES.Transient ||
    errorClass === INTEGRATION_ERROR_CLASSES.Timeout ||
    errorClass === INTEGRATION_ERROR_CLASSES.RateLimit
  );
}
