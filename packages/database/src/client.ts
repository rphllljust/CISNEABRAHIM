import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;

export type DatabaseConnection = {
  pool: Pool;
  db: Database;
};

export type PoolOptions = Pick<PoolConfig, 'max' | 'idleTimeoutMillis' | 'connectionTimeoutMillis'>;

const DEFAULT_POOL_OPTIONS: Required<PoolOptions> = {
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
};

export function resolvePoolOptions(overrides: Partial<PoolOptions> = {}): Required<PoolOptions> {
  const maxFromEnv = process.env['DATABASE_POOL_MAX'];
  const parsedMax = maxFromEnv ? Number(maxFromEnv) : undefined;

  return {
    max:
      overrides.max ??
      (parsedMax !== undefined && !Number.isNaN(parsedMax) ? parsedMax : DEFAULT_POOL_OPTIONS.max),
    idleTimeoutMillis: overrides.idleTimeoutMillis ?? DEFAULT_POOL_OPTIONS.idleTimeoutMillis,
    connectionTimeoutMillis:
      overrides.connectionTimeoutMillis ?? DEFAULT_POOL_OPTIONS.connectionTimeoutMillis,
  };
}

export function createDatabase(
  connectionString: string,
  poolOptions: Partial<PoolOptions> = {},
): DatabaseConnection {
  const pool = new Pool({
    connectionString,
    ...resolvePoolOptions(poolOptions),
  });

  const db = drizzle(pool, { schema });

  return { pool, db };
}

export type DatabaseHealth = {
  status: 'up' | 'down';
  latencyMs: number;
  error?: string;
};

export async function checkDatabaseHealth(pool: Pool): Promise<DatabaseHealth> {
  const startedAt = Date.now();

  try {
    await pool.query('SELECT 1');
    return {
      status: 'up',
      latencyMs: Date.now() - startedAt,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown error';
    return {
      status: 'down',
      latencyMs: Date.now() - startedAt,
      error: message,
    };
  }
}
