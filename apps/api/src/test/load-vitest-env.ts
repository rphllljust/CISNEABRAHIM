import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '../../../../');

/**
 * Loads repository env for Vitest (local .env first, then .env.example for dev/test URLs).
 * Never commit real secrets — .env.example uses disposable local PostgreSQL credentials only.
 */
export function loadVitestEnv(): void {
  const envFile = resolve(repoRoot, '.env');
  const exampleFile = resolve(repoRoot, '.env.example');

  if (existsSync(exampleFile)) {
    config({ path: exampleFile });
  }
  if (existsSync(envFile)) {
    config({ path: envFile });
  }

  process.env['JWT_SECRET'] ??= 'test-jwt-secret-with-at-least-32-characters!!';
}

export function getTestDatabaseUrl(): string | undefined {
  return process.env['TEST_DATABASE_URL']?.trim() || undefined;
}
