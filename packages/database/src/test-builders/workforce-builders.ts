import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export async function truncateWorkforceTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      wrk.workforce_member_history_events,
      wrk.workforce_members
    RESTART IDENTITY CASCADE
  `);
}
