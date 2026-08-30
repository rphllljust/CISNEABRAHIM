import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export async function truncateDomainEventTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      evt.notification_intents,
      evt.domain_events
    RESTART IDENTITY CASCADE
  `);
}
