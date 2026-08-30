import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export async function truncateBillingTables(client: DbClient): Promise<void> {
  await client.query('DELETE FROM bil.billing_command_idempotency');
  await client.query('DELETE FROM bil.billing_history_events');
  await client.query('DELETE FROM bil.billing_items');
  await client.query('DELETE FROM bil.billing_records');
}
