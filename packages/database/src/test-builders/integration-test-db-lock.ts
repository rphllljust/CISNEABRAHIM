import { Pool, type PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

/** Serializes integration-test DB reset/seed across Vitest workers and CLI processes. */
export const INTEGRATION_TEST_DB_LOCK_KEY = 0x43534e45;

const lockDepthByClient = new WeakMap<DbClient, number>();

export type IntegrationTestLockHolder = {
  pid: number;
  state: string | null;
  applicationName: string | null;
  granted: boolean;
};

export async function findIntegrationTestLockHolders(
  client: PoolClient,
  lockKey: number = INTEGRATION_TEST_DB_LOCK_KEY,
): Promise<IntegrationTestLockHolder[]> {
  const result = await client.query<{
    pid: number;
    state: string | null;
    application_name: string | null;
    granted: boolean;
  }>(
    `SELECT a.pid, a.state, a.application_name, l.granted
     FROM pg_locks l
     INNER JOIN pg_stat_activity a ON a.pid = l.pid
     WHERE l.locktype = 'advisory'
       AND l.objid = $1
       AND a.pid <> pg_backend_pid()`,
    [lockKey],
  );

  return result.rows.map((row) => ({
    pid: row.pid,
    state: row.state,
    applicationName: row.application_name,
    granted: row.granted,
  }));
}

function formatLockHolders(holders: IntegrationTestLockHolder[]): string {
  if (holders.length === 0) {
    return 'no foreign advisory lock holders reported';
  }
  return holders
    .map(
      (holder) =>
        `pid=${holder.pid} state=${holder.state ?? 'unknown'} granted=${holder.granted} app=${holder.applicationName ?? 'n/a'}`,
    )
    .join('; ');
}

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

  const holders = await findIntegrationTestLockHolders(client, lockKey).catch(() => []);
  throw new Error(
    `Timed out after ${timeoutMs}ms acquiring advisory lock ${lockKey} (owner pid=${process.pid}). ` +
      `Contention: ${formatLockHolders(holders)}.`,
  );
}

export async function releaseIntegrationTestDatabaseLock(
  client: PoolClient,
  lockKey: number = INTEGRATION_TEST_DB_LOCK_KEY,
): Promise<boolean> {
  const result = await client.query<{ released: boolean }>(
    'SELECT pg_advisory_unlock($1) AS released',
    [lockKey],
  );
  return result.rows[0]?.released === true;
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
