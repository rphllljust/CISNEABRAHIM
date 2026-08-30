const PRODUCTION_MARKERS = ['_prod', '-prod', '/prod', 'production', '.live.'];

export type HmlConfigSummary = {
  cisneEnv: string;
  nodeEnv: string;
  databaseHost: string | null;
  objectStorageBucket: string | null;
  publicApiUrl: string | null;
  publicWebUrl: string | null;
  emailOutboundEnabled: boolean;
  whatsappOutboundEnabled: boolean;
  integrationsSandboxMode: boolean;
};

function readDatabaseHost(databaseUrl: string | undefined): string | null {
  if (!databaseUrl) {
    return null;
  }
  try {
    return new URL(databaseUrl).hostname;
  } catch {
    return null;
  }
}

export function assertHmlIsolation(env: NodeJS.ProcessEnv = process.env): void {
  if (env['CISNE_ENV'] !== 'hml') {
    throw new Error('CISNE_ENV must be "hml" for homologation deploy');
  }

  const databaseUrl = env['DATABASE_URL']?.trim().toLowerCase() ?? '';
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for HML');
  }

  if (PRODUCTION_MARKERS.some((marker) => databaseUrl.includes(marker))) {
    throw new Error('HML DATABASE_URL must not reference production infrastructure');
  }

  if (env['HML_ALLOW_SHARED_DATABASE'] !== 'I_UNDERSTAND' && databaseUrl.includes('cisne_local_dev')) {
    throw new Error(
      'HML must use a dedicated database (e.g. cisne_hml); set HML_ALLOW_SHARED_DATABASE=I_UNDERSTAND to override locally',
    );
  }

  const bucket = env['OBJECT_STORAGE_BUCKET']?.trim().toLowerCase() ?? '';
  if (bucket && !bucket.includes('hml') && env['HML_ALLOW_SHARED_STORAGE'] !== 'I_UNDERSTAND') {
    throw new Error('OBJECT_STORAGE_BUCKET must be HML-specific (name should include "hml")');
  }
}

export function loadHmlIntegrationPolicy(env: NodeJS.ProcessEnv = process.env): {
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  sandboxMode: boolean;
} {
  const sandboxMode = env['HML_INTEGRATIONS_SANDBOX'] !== 'false';
  const emailConfigured = env['EMAIL_NOTIFICATION_CONFIGURED'] === 'true';
  const whatsappConfigured = env['WHATSAPP_NOTIFICATION_CONFIGURED'] === 'true';

  return {
    emailEnabled: emailConfigured && env['EMAIL_NOTIFICATION_ENABLED'] !== 'false' && !sandboxMode,
    whatsappEnabled: whatsappConfigured && env['WHATSAPP_NOTIFICATION_ENABLED'] !== 'false' && !sandboxMode,
    sandboxMode,
  };
}

export function summarizeHmlConfig(env: NodeJS.ProcessEnv = process.env): HmlConfigSummary {
  const integration = loadHmlIntegrationPolicy(env);
  return {
    cisneEnv: env['CISNE_ENV'] ?? 'unknown',
    nodeEnv: env['NODE_ENV'] ?? 'unknown',
    databaseHost: readDatabaseHost(env['DATABASE_URL']),
    objectStorageBucket: env['OBJECT_STORAGE_BUCKET'] ?? null,
    publicApiUrl: env['HML_PUBLIC_API_URL'] ?? null,
    publicWebUrl: env['HML_PUBLIC_WEB_URL'] ?? null,
    emailOutboundEnabled: integration.emailEnabled,
    whatsappOutboundEnabled: integration.whatsappEnabled,
    integrationsSandboxMode: integration.sandboxMode,
  };
}

export function assertHmlOutboundSafety(env: NodeJS.ProcessEnv = process.env): void {
  const policy = loadHmlIntegrationPolicy(env);
  if (policy.emailEnabled || policy.whatsappEnabled) {
    throw new Error(
      'HML outbound email/WhatsApp must stay disabled unless HML_INTEGRATIONS_SANDBOX=false and provider sandbox is configured',
    );
  }
}
