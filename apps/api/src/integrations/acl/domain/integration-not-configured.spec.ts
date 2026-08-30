import { describe, expect, it } from 'vitest';
import {
  INTEGRATION_NOT_CONFIGURED_CODE,
  IntegrationNotConfiguredError,
  isIntegrationNotConfiguredError,
} from './integration-not-configured';

describe('integration-not-configured', () => {
  it('uses a stable platform error code', () => {
    const error = new IntegrationNotConfiguredError('ERP');
    expect(error.message).toBe(INTEGRATION_NOT_CONFIGURED_CODE);
    expect(isIntegrationNotConfiguredError(error)).toBe(true);
    expect(error.integration).toBe('ERP');
  });
});
