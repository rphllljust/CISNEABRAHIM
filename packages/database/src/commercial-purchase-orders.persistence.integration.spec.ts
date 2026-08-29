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

describe('Commercial purchase orders persistence migration', () => {
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

  it('creates purchase order tables idempotently when baseline exists', async () => {
    const hasPurchaseOrders = await tableExists(pool, 'com.purchase_orders');
    if (!hasPurchaseOrders) {
      await applyMigration(pool, '0017_commercial_purchase_orders_baseline.sql');
    }

    expect(await tableExists(pool, 'com.purchase_orders')).toBe(true);
    expect(await tableExists(pool, 'com.purchase_order_items')).toBe(true);
    expect(await tableExists(pool, 'com.purchase_order_billing_rules')).toBe(true);
    expect(await tableExists(pool, 'com.purchase_order_document_links')).toBe(true);
  });

  it('defines unique PO number per client for active registrations', async () => {
    const hasPurchaseOrders = await tableExists(pool, 'com.purchase_orders');
    if (!hasPurchaseOrders) {
      await applyMigration(pool, '0017_commercial_purchase_orders_baseline.sql');
    }

    const indexes = await pool.query<{ indexname: string }>(
      `SELECT indexname
       FROM pg_indexes
       WHERE schemaname = 'com'
         AND tablename = 'purchase_orders'
         AND indexname = 'purchase_orders_client_po_number_active_uidx'`,
    );
    expect(indexes.rowCount).toBe(1);
  });
});
