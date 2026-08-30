import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export async function truncateBillingTables(client: DbClient): Promise<void> {
  await client.query('DELETE FROM bil.billing_document_command_idempotency');
  await client.query('DELETE FROM bil.billing_document_history_events');
  await client.query('DELETE FROM bil.billing_document_items');
  await client.query('DELETE FROM bil.billing_documents');
  await client.query('DELETE FROM bil.billing_document_number_sequences');
  await client.query('DELETE FROM bil.billing_command_idempotency');
  await client.query('DELETE FROM bil.billing_history_events');
  await client.query('DELETE FROM bil.billing_items');
  await client.query('DELETE FROM bil.billing_records');
}
