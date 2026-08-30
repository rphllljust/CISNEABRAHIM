import {
  INTEGRATION_ERROR_CLASSES,
  classifyIntegrationError,
  isIntegrationProviderError,
} from '../domain/integration-error';
import { INTEGRATION_NOT_CONFIGURED_CODE } from '../domain/integration-not-configured';

const SAFE_USER_MESSAGES: Record<string, string> = {
  [INTEGRATION_ERROR_CLASSES.Authentication]: 'INTEGRATION_ACCESS_DENIED',
  [INTEGRATION_ERROR_CLASSES.Authorization]: 'INTEGRATION_ACCESS_DENIED',
  [INTEGRATION_ERROR_CLASSES.RateLimit]: 'INTEGRATION_TEMPORARILY_UNAVAILABLE',
  [INTEGRATION_ERROR_CLASSES.Transient]: 'INTEGRATION_TEMPORARILY_UNAVAILABLE',
  [INTEGRATION_ERROR_CLASSES.Timeout]: 'INTEGRATION_TEMPORARILY_UNAVAILABLE',
  [INTEGRATION_ERROR_CLASSES.InvalidPayload]: 'INTEGRATION_DATA_INVALID',
  [INTEGRATION_ERROR_CLASSES.Permanent]: 'INTEGRATION_OPERATION_FAILED',
};

export function toSafeIntegrationUserMessage(error: unknown): string {
  if (isIntegrationProviderError(error) && error.message === INTEGRATION_NOT_CONFIGURED_CODE) {
    return INTEGRATION_NOT_CONFIGURED_CODE;
  }
  const errorClass = classifyIntegrationError(error);
  return SAFE_USER_MESSAGES[errorClass] ?? 'INTEGRATION_OPERATION_FAILED';
}

export function integrationErrorLogDetail(error: unknown): string {
  if (isIntegrationProviderError(error)) {
    const vendorSuffix = error.vendorDetail ? ` vendor=${error.vendorDetail}` : '';
    return `${error.errorClass}:${error.message}${vendorSuffix}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
