import { describe, expect, it } from 'vitest';
import { loadIntegrationCapabilitySnapshot } from '../config/integration-capability.config';

describe('integration capability config', () => {
  it('reports ERP and tracking as disabled without external configuration', () => {
    delete process.env['ERP_INTEGRATION_CONFIGURED'];
    delete process.env['ERP_PROVIDER_ID'];
    delete process.env['ERP_API_BASE_URL'];
    delete process.env['TRACKING_INTEGRATION_CONFIGURED'];
    delete process.env['TRACKING_PROVIDER_ID'];
    delete process.env['TRACKING_API_BASE_URL'];

    const snapshot = loadIntegrationCapabilitySnapshot();
    expect(snapshot.erp).toEqual({ configured: false, enabled: false });
    expect(snapshot.tracking).toEqual({ configured: false, enabled: false });
  });
});
