import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const exampleFile = resolve(repoRoot, '.env.example');
const envFile = resolve(repoRoot, '.env');
if (existsSync(exampleFile)) {
  config({ path: exampleFile });
}
if (existsSync(envFile)) {
  config({ path: envFile });
}

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  console.error('TEST_DATABASE_URL is required.');
  process.exit(1);
}

const INTEGRATION_TEST_DB_LOCK_KEY = 0x43534e45;

const pool = new Pool({ connectionString: testDatabaseUrl, max: 1 });

try {
  const holders = await pool.query(
    `SELECT a.pid, a.state
     FROM pg_locks l
     INNER JOIN pg_stat_activity a ON a.pid = l.pid
     WHERE l.locktype = 'advisory'
       AND l.objid = $1
       AND a.pid <> pg_backend_pid()`,
    [INTEGRATION_TEST_DB_LOCK_KEY],
  );

  if ((holders.rowCount ?? 0) === 0) {
    console.log('No foreign advisory lock holders found.');
  } else {
    for (const row of holders.rows) {
      console.log(`Terminating pid=${row.pid} state=${row.state}`);
      await pool.query('SELECT pg_terminate_backend($1)', [row.pid]);
    }
  }

  const acquired = await pool.query('SELECT pg_try_advisory_lock($1) AS acquired', [
    INTEGRATION_TEST_DB_LOCK_KEY,
  ]);
  if (acquired.rows[0]?.acquired) {
    await pool.query('SELECT pg_advisory_unlock($1)', [INTEGRATION_TEST_DB_LOCK_KEY]);
    console.log('Integration test lock is available.');
  } else {
    console.log('Integration test lock still unavailable after cleanup.');
    process.exit(1);
  }
} finally {
  await pool.end();
}
