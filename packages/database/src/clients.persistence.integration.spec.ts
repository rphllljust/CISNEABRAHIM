import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Clients persistence migration', () => {
  let pool: Pool;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(() => {
    if (!testDatabaseUrl) {
      throw new Error('TEST_DATABASE_URL is required for clients persistence tests.');
    }
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('applies clients baseline migration on empty-compatible database', async () => {
    const migrationPath = resolve(__dirname, '../migrations/0006_clients_baseline.sql');
    const sql = readFileSync(migrationPath, 'utf8');
    const statements = sql
      .split('--> statement-breakpoint')
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0);

    for (const statement of statements) {
      try {
        await pool.query(statement);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('already exists')) {
          continue;
        }
        throw error;
      }
    }

    const tables = await pool.query<{ tablename: string }>(
      `SELECT tablename
       FROM pg_tables
       WHERE schemaname = 'pty'
       ORDER BY tablename`,
    );
    expect(tables.rows.map((row) => row.tablename)).toEqual([
      'client_addresses',
      'client_contacts',
      'clients',
    ]);
  });
});
