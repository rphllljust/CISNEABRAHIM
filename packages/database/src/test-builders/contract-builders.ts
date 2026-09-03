import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export async function truncateCommercialContractTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      com.contract_history_events,
      com.contract_document_links,
      com.contract_items,
      com.contracts
    RESTART IDENTITY CASCADE
  `);
}
