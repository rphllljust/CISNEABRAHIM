import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { getTestDatabaseUrl, loadRepoEnv, syncDrizzleJournal } from './lib/database-test-env.mjs';

loadRepoEnv();

const testDatabaseUrl = getTestDatabaseUrl();
if (!testDatabaseUrl) {
  console.error('TEST_DATABASE_URL is required.');
  process.exit(1);
}

const require = createRequire(resolve(import.meta.dirname, '../packages/database/package.json'));
const { Pool } = require('pg');

const pool = new Pool({ connectionString: testDatabaseUrl });
try {
  const result = await syncDrizzleJournal(pool);
  console.log(JSON.stringify({ testDatabaseUrl: '[configured]', ...result }));
} finally {
  await pool.end();
}
