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

describe('Service requests persistence migration', () => {
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

  it('creates sr schema tables idempotently', async () => {
    const hasServiceRequests = await tableExists(pool, 'sr.service_requests');
    if (!hasServiceRequests) {
      await applyMigration(pool, '0018_service_requests_baseline.sql');
    }

    expect(await tableExists(pool, 'sr.service_requests')).toBe(true);
    expect(await tableExists(pool, 'sr.service_request_document_links')).toBe(true);
  });

  it('requires converted_service_order_id when status is CONVERTED', async () => {
    const hasServiceRequests = await tableExists(pool, 'sr.service_requests');
    if (!hasServiceRequests) {
      await applyMigration(pool, '0018_service_requests_baseline.sql');
    }

    const constraints = await pool.query<{ conname: string }>(
      `SELECT conname
       FROM pg_constraint
       WHERE conrelid = 'sr.service_requests'::regclass
         AND conname = 'service_requests_converted_service_order_when_converted_chk'`,
    );
    expect(constraints.rowCount).toBe(1);
  });
});
