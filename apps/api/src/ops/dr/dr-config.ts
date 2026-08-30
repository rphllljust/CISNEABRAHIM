const PRODUCTION_DB_MARKERS = ['prod', 'production', 'live'];

export function assertDrIsolatedEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  if (env['NODE_ENV'] === 'production' && env['DR_ALLOW_PRODUCTION'] !== 'I_UNDERSTAND') {
    throw new Error('DR drill blocked: never restore on production without DR_ALLOW_PRODUCTION=I_UNDERSTAND');
  }

  const drDatabaseUrl = resolveDrDatabaseUrl(env);
  if (!drDatabaseUrl) {
    throw new Error('DR_DATABASE_URL or TEST_DATABASE_URL is required for isolated DR drill');
  }

  const appDatabaseUrl = env['DATABASE_URL']?.trim();
  if (
    appDatabaseUrl &&
    drDatabaseUrl === appDatabaseUrl &&
    env['DR_CONFIRM_SAME_AS_APP_DB'] !== 'I_UNDERSTAND'
  ) {
    throw new Error(
      'DR drill must use an isolated database URL; set DR_DATABASE_URL or DR_CONFIRM_SAME_AS_APP_DB=I_UNDERSTAND',
    );
  }

  const lowerUrl = drDatabaseUrl.toLowerCase();
  if (PRODUCTION_DB_MARKERS.some((marker) => lowerUrl.includes(marker))) {
    throw new Error('DR drill blocked: database URL appears to reference production');
  }
}

export function resolveDrDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string | null {
  return env['DR_DATABASE_URL']?.trim() ?? env['TEST_DATABASE_URL']?.trim() ?? null;
}

export function resolveDrObjectStorageRoot(env: NodeJS.ProcessEnv = process.env): string | null {
  return env['DR_OBJECT_STORAGE_ROOT']?.trim() ?? env['OBJECT_STORAGE_ROOT']?.trim() ?? null;
}

/** Canonical object storage used as hydration source when DR root is isolated. */
export function resolveObjectStorageSourceRoot(env: NodeJS.ProcessEnv = process.env): string | null {
  return env['DR_OBJECT_STORAGE_SOURCE']?.trim() ?? env['OBJECT_STORAGE_ROOT']?.trim() ?? null;
}

export function resolveDrScenario(env: NodeJS.ProcessEnv = process.env): import('./dr-types').DrScenarioId {
  const raw = env['DR_SCENARIO']?.trim().toLowerCase() ?? 'bad_deployment';
  const allowed = [
    'db_loss',
    'application_host_loss',
    'object_storage_partial_loss',
    'bad_deployment',
    'credential_rotation',
  ] as const;
  if ((allowed as readonly string[]).includes(raw)) {
    return raw as import('./dr-types').DrScenarioId;
  }
  return 'bad_deployment';
}
