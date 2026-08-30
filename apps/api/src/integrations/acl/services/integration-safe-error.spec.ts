import { describe, expect, it } from 'vitest';
import { INTEGRATION_ERROR_CLASSES, IntegrationProviderError } from '../domain/integration-error';
import { IntegrationNotConfiguredError } from '../domain/integration-not-configured';
import { toSafeIntegrationUserMessage } from './integration-safe-error';

describe('integration-safe-error', () => {
  it('never exposes raw vendor detail to end users', () => {
    const error = new IntegrationProviderError(
      INTEGRATION_ERROR_CLASSES.Authentication,
      'DYGNUS_AUTHENTICATION_FAILED',
      { vendorDetail: '{"secret":"do-not-leak"}' },
    );

    const message = toSafeIntegrationUserMessage(error);
    expect(message).toBe('INTEGRATION_ACCESS_DENIED');
    expect(message).not.toContain('secret');
    expect(message).not.toContain('DYGNUS');
  });

  it('maps transient failures to a generic temporary message', () => {
    const error = new IntegrationProviderError(
      INTEGRATION_ERROR_CLASSES.Transient,
      'DYGNUS_UPSTREAM_UNAVAILABLE',
      { vendorDetail: 'upstream exploded' },
    );
    expect(toSafeIntegrationUserMessage(error)).toBe('INTEGRATION_TEMPORARILY_UNAVAILABLE');
  });

  it('preserves INTEGRATION_NOT_CONFIGURED for unconfigured integrations', () => {
    const error = new IntegrationNotConfiguredError('ERP');
    expect(toSafeIntegrationUserMessage(error)).toBe('INTEGRATION_NOT_CONFIGURED');
  });
});
