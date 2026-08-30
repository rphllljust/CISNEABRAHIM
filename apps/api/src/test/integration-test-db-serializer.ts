import { Pool } from 'pg';
import { afterAll, beforeAll } from 'vitest';
import { INTEGRATION_TEST_DB_LOCK_KEY } from '@cisne/database';

const testDatabaseUrl = process.env['TEST_DATABASE_URL'];
if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL is required for integration/E2E database serialization.');
}

const serializerPool = new Pool({ connectionString: testDatabaseUrl, max: 1 });

beforeAll(async () => {
  await serializerPool.query('SELECT pg_advisory_lock($1)', [INTEGRATION_TEST_DB_LOCK_KEY]);
}, 180_000);

afterAll(async () => {
  await serializerPool.query('SELECT pg_advisory_unlock($1)', [INTEGRATION_TEST_DB_LOCK_KEY]);
  await serializerPool.end();
});
