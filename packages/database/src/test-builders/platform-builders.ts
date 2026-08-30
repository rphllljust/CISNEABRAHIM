import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export async function truncateBackgroundJobTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE plt.background_jobs RESTART IDENTITY CASCADE
  `);
}
