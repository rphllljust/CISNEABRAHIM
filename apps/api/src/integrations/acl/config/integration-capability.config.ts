export type IntegrationCapability = {
  configured: boolean;
  enabled: boolean;
};

export type IntegrationCapabilitySnapshot = {
  erp: IntegrationCapability;
  tracking: IntegrationCapability;
};

function readBooleanEnv(name: string): boolean {
  return process.env[name] === 'true';
}

/** SRC-004 / BR-042: conexão com ERP é REJECTED. Env não liga adapter. */
export function isErpIntegrationConfigured(): boolean {
  return false;
}

export function isTrackingIntegrationConfigured(): boolean {
  return (
    readBooleanEnv('TRACKING_INTEGRATION_CONFIGURED') &&
    typeof process.env['TRACKING_PROVIDER_ID'] === 'string' &&
    process.env['TRACKING_PROVIDER_ID'].length > 0 &&
    typeof process.env['TRACKING_API_BASE_URL'] === 'string' &&
    process.env['TRACKING_API_BASE_URL'].length > 0
  );
}

export function loadIntegrationCapabilitySnapshot(): IntegrationCapabilitySnapshot {
  const erpConfigured = isErpIntegrationConfigured();
  const trackingConfigured = isTrackingIntegrationConfigured();

  return {
    erp: {
      configured: erpConfigured,
      enabled: false,
    },
    tracking: {
      configured: trackingConfigured,
      enabled: trackingConfigured && process.env['TRACKING_INTEGRATION_ENABLED'] !== 'false',
    },
  };
}
