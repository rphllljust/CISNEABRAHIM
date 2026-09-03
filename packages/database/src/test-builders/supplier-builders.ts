import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export async function truncateSupplierTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      pty.supplier_history_events,
      pty.supplier_addresses,
      pty.supplier_contacts,
      pty.suppliers
    RESTART IDENTITY CASCADE
  `);
}
