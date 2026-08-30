import type { Pool, PoolClient } from 'pg';
import { SYNTHETIC_SEED_ADVISORY_LOCK_KEY } from './synthetic-seed-constants';

type DbClient = Pool | PoolClient;

const lockDepthByClient = new WeakMap<DbClient, number>();

export async function withSyntheticSeedLock<T>(client: DbClient, run: () => Promise<T>): Promise<T> {
  const depth = lockDepthByClient.get(client) ?? 0;
  if (depth === 0) {
    await client.query('SELECT pg_advisory_lock($1)', [SYNTHETIC_SEED_ADVISORY_LOCK_KEY]);
  }
  lockDepthByClient.set(client, depth + 1);
  try {
    return await run();
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
