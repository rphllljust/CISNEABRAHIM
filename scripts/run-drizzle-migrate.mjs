import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import {
  getTestDatabaseUrl,
  loadRepoEnv,
  syncDrizzleJournal,
} from './lib/database-test-env.mjs';

loadRepoEnv();

const testDatabaseUrl = getTestDatabaseUrl();
if (!testDatabaseUrl) {
  console.error(
    'TEST_DATABASE_URL is required. Copy .env.example to .env and start PostgreSQL (pnpm db:up).',
  );
  process.exit(1);
}

const require = createRequire(resolve(import.meta.dirname, '../packages/database/package.json'));
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');

const pool = new Pool({ connectionString: testDatabaseUrl });

try {
  const sync = await syncDrizzleJournal(pool);
  if (sync.inserted > 0) {
    console.log(`Repaired drizzle journal on test database (${sync.inserted} entries).`);
  }

  const db = drizzle(pool);
  await migrate(db, {
    migrationsFolder: resolve(import.meta.dirname, '../packages/database/migrations'),
  });
  console.log('Drizzle migrations applied successfully.');
} catch (error) {
  console.error('Migration failed:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
