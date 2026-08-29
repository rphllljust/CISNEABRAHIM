import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function tableExists(pool: Pool, table: string): Promise<boolean> {
  const result = await pool.query<{ regclass: string | null }>(
    'SELECT to_regclass($1) AS regclass',
    [table],
  );
  return result.rows[0]?.regclass !== null;
}

async function applyMigration(pool: Pool, fileName: string): Promise<void> {
  const filePath = resolve(__dirname, '../migrations', fileName);
  const sql = readFileSync(filePath, 'utf8');
  const statements = sql
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  for (const statement of statements) {
    await pool.query(statement);
  }
}

describe('Physical assets persistence migration', () => {
  let pool: Pool;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(() => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required.');
    }
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('creates ast schema tables and constraints idempotently when baseline exists', async () => {
    const hasAssets = await tableExists(pool, 'ast.physical_assets');
    if (!hasAssets) {
      await applyMigration(pool, '0014_physical_assets_baseline.sql');
    }

    const schema = await pool.query<{ schema_name: string }>(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'ast'`,
    );
    expect(schema.rowCount).toBe(1);

    const assetTable = await tableExists(pool, 'ast.physical_assets');
    const vehicleTable = await tableExists(pool, 'ast.vehicle_profiles');
    expect(assetTable).toBe(true);
    expect(vehicleTable).toBe(true);

    const lifecycleEnum = await pool.query(
      `SELECT 1 FROM pg_type t
       INNER JOIN pg_namespace n ON n.oid = t.typnamespace
       WHERE n.nspname = 'ast' AND t.typname = 'asset_lifecycle_status'`,
    );
    const allocationEnum = await pool.query(
      `SELECT 1 FROM pg_type t
       INNER JOIN pg_namespace n ON n.oid = t.typnamespace
       WHERE n.nspname = 'ast' AND t.typname = 'asset_allocation_status'`,
    );
    expect(lifecycleEnum.rowCount).toBe(1);
    expect(allocationEnum.rowCount).toBe(1);
  });
});
