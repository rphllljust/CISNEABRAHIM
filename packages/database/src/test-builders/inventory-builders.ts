import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export async function truncateInventoryTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      inv.stock_movements,
      inv.stock_reservations,
      inv.stock_position_locks,
      inv.costing_rule_versions,
      inv.costing_rules,
      inv.inventory_items,
      inv.warehouses
    RESTART IDENTITY CASCADE
  `);
}
