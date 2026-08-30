import { Pool, type PoolClient } from 'pg';
import { SYNTHETIC_SEED_ADVISORY_LOCK_KEY } from './synthetic-seed-constants';

type DbClient = Pool | PoolClient;

const lockDepthByClient = new WeakMap<DbClient, number>();

async function withDedicatedPoolClient<T>(pool: Pool, run: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    return await run(client);
  } finally {
    client.release();
  }
}

export async function withSyntheticSeedLock<T>(
  client: DbClient,
  run: (lockedClient: PoolClient) => Promise<T>,
): Promise<T> {
  if (client instanceof Pool) {
    return withDedicatedPoolClient(client, (dedicatedClient) => withSyntheticSeedLock(dedicatedClient, run));
  }

  const depth = lockDepthByClient.get(client) ?? 0;
  if (depth === 0) {
    await client.query('SELECT pg_advisory_lock($1)', [SYNTHETIC_SEED_ADVISORY_LOCK_KEY]);
  }
  lockDepthByClient.set(client, depth + 1);
  try {
    return await run(client);
  } finally {
    const nextDepth = (lockDepthByClient.get(client) ?? 1) - 1;
    if (nextDepth <= 0) {
      lockDepthByClient.delete(client);
      await client.query('SELECT pg_advisory_unlock($1)', [SYNTHETIC_SEED_ADVISORY_LOCK_KEY]);
    } else {
      lockDepthByClient.set(client, nextDepth);
    }
  }
}
