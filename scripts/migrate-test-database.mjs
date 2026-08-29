import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { applyContextualScopeMigrations } from './apply-contextual-scope-migrations.mjs';

const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

if (!testDatabaseUrl) {
  console.error('TEST_DATABASE_URL is required to migrate the integration-test database.');
  process.exit(1);
}

const databasePackageDir = resolve('packages/database');

const result = spawnSync('pnpm', ['exec', 'drizzle-kit', 'migrate'], {
  cwd: databasePackageDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    DATABASE_URL: testDatabaseUrl,
  },
  shell: true,
});

if (result.status !== 0) {
  await applyContextualScopeMigrations(testDatabaseUrl);
}

process.exit(0);
