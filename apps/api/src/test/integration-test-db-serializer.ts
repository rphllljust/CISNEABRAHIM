import { Pool, type PoolClient } from 'pg';
import { afterAll, beforeAll } from 'vitest';
import {
  acquireAdvisoryLockWithTimeout,
  INTEGRATION_TEST_DB_LOCK_KEY,
  releaseIntegrationTestDatabaseLock,
} from '@cisne/database';

const testDatabaseUrl = process.env['TEST_DATABASE_URL'];
if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL is required for integration/E2E database serialization.');
}

process.env['DATABASE_POOL_MAX'] ??= '1';

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

async function releaseSerializerLock(): Promise<void> {
  if (!serializerClient || !lockHeld) {
    return;
  }
  let released = false;
  try {
    released = await releaseIntegrationTestDatabaseLock(serializerClient, INTEGRATION_TEST_DB_LOCK_KEY);
  } catch {
    // Connection may already be terminated (e.g. pg_terminate_backend).
  } finally {
    lockHeld = false;
  }
  if (!released) {
    releaseSerializerClient(true);
  }
}

async function shutdownSerializerPool(): Promise<void> {
  await releaseSerializerLock();
  releaseSerializerClient(true);
  await serializerPool.end();
}

let shutdownRegistered = false;
function registerSerializerShutdown(): void {
  if (shutdownRegistered) {
    return;
  }
  shutdownRegistered = true;
  process.once('beforeExit', () => {
    void shutdownSerializerPool();
  });
}

registerSerializerShutdown();

beforeAll(async () => {
  serializerClient = await serializerPool.connect();
  try {
    await acquireAdvisoryLockWithTimeout(serializerClient, INTEGRATION_TEST_DB_LOCK_KEY, 180_000);
    lockHeld = true;
  } catch (error) {
    releaseSerializerClient(true);
    throw error;
  }
}, 180_000);

afterAll(async () => {
  try {
    await releaseSerializerLock();
  } finally {
    releaseSerializerClient();
  }
}, 180_000);
