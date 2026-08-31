import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export async function truncateCommercialPurchaseOrderTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      com.purchase_order_consumption_entries,
      com.purchase_order_document_links,
      com.purchase_order_billing_rules,
      com.purchase_order_items,
      com.purchase_orders
    RESTART IDENTITY CASCADE
  `);
}
