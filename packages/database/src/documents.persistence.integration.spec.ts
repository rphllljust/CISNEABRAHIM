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

describe('Documents persistence migration', () => {
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

  it('creates doc schema tables and constraints idempotently when baseline exists', async () => {
    const hasDocuments = await tableExists(pool, 'doc.documents');
    if (!hasDocuments) {
      await applyMigration(pool, '0015_documents_baseline.sql');
    }

    const schema = await pool.query<{ schema_name: string }>(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'doc'`,
    );
    expect(schema.rowCount).toBe(1);

    expect(await tableExists(pool, 'doc.documents')).toBe(true);
    expect(await tableExists(pool, 'doc.document_versions')).toBe(true);
    expect(await tableExists(pool, 'doc.stored_objects')).toBe(true);

    const statusEnum = await pool.query(
      `SELECT 1 FROM pg_type t
       INNER JOIN pg_namespace n ON n.oid = t.typnamespace
       WHERE n.nspname = 'doc' AND t.typname = 'document_status'`,
    );
    expect(statusEnum.rowCount).toBe(1);
  });
});
