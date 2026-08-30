import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export async function truncateBackgroundJobTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE plt.background_jobs RESTART IDENTITY CASCADE
  `);
}

export async function truncateOutboxTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE evt.outbox_events RESTART IDENTITY CASCADE
  `);
}
