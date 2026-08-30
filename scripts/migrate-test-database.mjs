import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { loadRepoEnv, getTestDatabaseUrl } from './lib/database-test-env.mjs';

loadRepoEnv();

if (!getTestDatabaseUrl()) {
  console.error(
    'TEST_DATABASE_URL is required to migrate the integration-test database. Copy .env.example to .env and start PostgreSQL (pnpm db:up).',
  );
  process.exit(1);
}

const result = spawnSync('node', [resolve(import.meta.dirname, 'run-drizzle-migrate.mjs')], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
