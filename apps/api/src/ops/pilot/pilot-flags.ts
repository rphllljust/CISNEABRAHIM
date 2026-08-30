/**
 * Minimal env gates — no feature-flag framework.
 * Flags activate only when PILOT_INFRA_EXTENDED=true justifies extra surface.
 */
export type PilotEnvFlag = 'EXTENDED_SERVICES' | 'EXTERNAL_INTEGRATIONS';

const FLAG_ENV_KEYS: Record<PilotEnvFlag, string> = {
  EXTENDED_SERVICES: 'PILOT_FLAG_EXTENDED_SERVICES',
  EXTERNAL_INTEGRATIONS: 'PILOT_FLAG_EXTERNAL_INTEGRATIONS',
};

export function isPilotEnvFlagEnabled(
  flag: PilotEnvFlag,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env['PILOT_INFRA_EXTENDED'] !== 'true') {
    return false;
  }
  return env[FLAG_ENV_KEYS[flag]] === 'true';
}

export function listPilotEnvFlags(env: NodeJS.ProcessEnv = process.env): Record<string, boolean> {
  return {
    extendedServices: isPilotEnvFlagEnabled('EXTENDED_SERVICES', env),
    externalIntegrations: isPilotEnvFlagEnabled('EXTERNAL_INTEGRATIONS', env),
  };
}

export function assertNoUnauthorizedPilotFlags(env: NodeJS.ProcessEnv = process.env): void {
  for (const key of Object.keys(env)) {
    if (!key.startsWith('PILOT_FLAG_')) {
      continue;
    }
    if (env['PILOT_INFRA_EXTENDED'] === 'true') {
      continue;
    }
    if (env[key] === 'true') {
      throw new Error(
        `${key}=true requires PILOT_INFRA_EXTENDED=true — do not enable flags without real infra justification`,
      );
    }
  }
}
