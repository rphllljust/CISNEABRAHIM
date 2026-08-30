import { Pool, type PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

/** Serializes integration-test DB reset/seed across Vitest workers and CLI processes. */
export const INTEGRATION_TEST_DB_LOCK_KEY = 0x43534e45;

const lockDepthByClient = new WeakMap<DbClient, number>();

export async function acquireAdvisoryLockWithTimeout(
  client: PoolClient,
  lockKey: number,
  timeoutMs = 30_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await client.query<{ acquired: boolean }>(
      'SELECT pg_try_advisory_lock($1) AS acquired',
      [lockKey],
    );
    if (result.rows[0]?.acquired) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(
    `Timed out after ${timeoutMs}ms acquiring advisory lock ${lockKey}. ` +
      'Another integration test process may be holding the database serializer lock.',
  );
}

export async function withIntegrationTestDatabaseLock<T>(
  client: DbClient,
  run: () => Promise<T>,
): Promise<T> {
  const depth = lockDepthByClient.get(client) ?? 0;
  if (depth === 0) {
    await client.query('SELECT pg_advisory_lock($1)', [INTEGRATION_TEST_DB_LOCK_KEY]);
  }
  lockDepthByClient.set(client, depth + 1);
  try {
    return await run();
  } finally {
    const nextDepth = (lockDepthByClient.get(client) ?? 1) - 1;
    if (nextDepth <= 0) {
      lockDepthByClient.delete(client);
      await client.query('SELECT pg_advisory_unlock($1)', [INTEGRATION_TEST_DB_LOCK_KEY]);
    } else {
      lockDepthByClient.set(client, nextDepth);
    }
  }
}

/** Single-connection pools keep advisory locks effective for all queries in a Vitest process. */
export function createIntegrationTestPool(connectionString: string): Pool {
  return new Pool({ connectionString, max: 1 });
}
