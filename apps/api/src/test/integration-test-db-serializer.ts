import { Pool, type PoolClient } from 'pg';
import { afterAll, beforeAll } from 'vitest';
import { acquireAdvisoryLockWithTimeout, INTEGRATION_TEST_DB_LOCK_KEY } from '@cisne/database';

const testDatabaseUrl = process.env['TEST_DATABASE_URL'];
if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL is required for integration/E2E database serialization.');
}

const serializerPool = new Pool({ connectionString: testDatabaseUrl, max: 1 });
let serializerClient: PoolClient | undefined;
let lockHeld = false;

function releaseSerializerClient(destroy = false): void {
  if (!serializerClient) {
    return;
  }
  try {
    if (destroy) {
      serializerClient.release(true);
    } else {
      serializerClient.release();
    }
  } catch {
    // Connection may already be terminated (e.g. pg_terminate_backend).
  }
  serializerClient = undefined;
}

beforeAll(async () => {
  serializerClient = await serializerPool.connect();
  try {
    await acquireAdvisoryLockWithTimeout(serializerClient, INTEGRATION_TEST_DB_LOCK_KEY);
    lockHeld = true;
  } catch (error) {
    releaseSerializerClient(true);
    throw error;
  }
}, 180_000);

afterAll(async () => {
  try {
    if (serializerClient && lockHeld) {
      try {
        await serializerClient.query('SELECT pg_advisory_unlock($1)', [INTEGRATION_TEST_DB_LOCK_KEY]);
      } catch {
        // Session-scoped advisory locks are released when the backend ends.
      }
      lockHeld = false;
    }
  } finally {
    releaseSerializerClient();
    await serializerPool.end();
  }
});
