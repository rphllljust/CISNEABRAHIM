import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export async function truncateProcurementTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      prc.three_way_matches,
      prc.supplier_invoices,
      prc.goods_receipt_lines,
      prc.goods_receipts,
      prc.supplier_purchase_order_lines,
      prc.supplier_purchase_orders,
      prc.purchase_request_approvals,
      prc.purchase_request_lines,
      prc.purchase_requests
    RESTART IDENTITY CASCADE
  `);
}
