import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export async function truncatePhysicalAssetTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      ast.vehicle_profiles,
      ast.physical_assets
    RESTART IDENTITY CASCADE
  `);
}
