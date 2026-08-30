import {
  INTEGRATION_ERROR_CLASSES,
  IntegrationProviderError,
} from './integration-error';

export const INTEGRATION_NOT_CONFIGURED_CODE = 'INTEGRATION_NOT_CONFIGURED';

export type UnconfiguredIntegrationKind = 'ERP' | 'TRACKING' | 'FISCAL' | 'NOTIFICATION';

export class IntegrationNotConfiguredError extends IntegrationProviderError {
  readonly integration: UnconfiguredIntegrationKind;

  constructor(integration: UnconfiguredIntegrationKind) {
    super(INTEGRATION_ERROR_CLASSES.Permanent, INTEGRATION_NOT_CONFIGURED_CODE, {
      vendorDetail: integration,
    });
    this.name = 'IntegrationNotConfiguredError';
    this.integration = integration;
  }
}

export function isIntegrationNotConfiguredError(
  error: unknown,
): error is IntegrationNotConfiguredError {
  return error instanceof IntegrationNotConfiguredError;
}

export function throwIntegrationNotConfigured(
  integration: UnconfiguredIntegrationKind,
): never {
  throw new IntegrationNotConfiguredError(integration);
}
