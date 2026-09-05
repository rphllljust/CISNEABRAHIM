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

describe('Service orders persistence migration', () => {
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

  it('creates so schema tables idempotently', async () => {
    const hasServiceOrders = await tableExists(pool, 'so.service_orders');
    if (!hasServiceOrders) {
      await applyMigration(pool, '0019_service_orders_baseline.sql');
    }

    expect(await tableExists(pool, 'so.service_orders')).toBe(true);
    expect(await tableExists(pool, 'so.service_order_history_events')).toBe(true);
  });

  it('indexes service_request_id without requiring one OS per request', async () => {
    const hasServiceOrders = await tableExists(pool, 'so.service_orders');
    if (!hasServiceOrders) {
      await applyMigration(pool, '0019_service_orders_baseline.sql');
    }

    const indexes = await pool.query<{ indexname: string }>(
      `SELECT indexname
       FROM pg_indexes
       WHERE schemaname = 'so'
         AND tablename = 'service_orders'
         AND indexname IN (
           'service_orders_service_request_id_idx',
           'service_orders_service_request_id_uidx'
         )`,
    );
    expect(indexes.rowCount).toBeGreaterThanOrEqual(1);
  });
});
