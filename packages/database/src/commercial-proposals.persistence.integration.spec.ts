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

describe('Commercial proposals persistence migration', () => {
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

  it('creates com schema proposal tables idempotently when baseline exists', async () => {
    const hasProposals = await tableExists(pool, 'com.proposals');
    if (!hasProposals) {
      await applyMigration(pool, '0016_commercial_proposals_baseline.sql');
    }

    expect(await tableExists(pool, 'com.proposals')).toBe(true);
    expect(await tableExists(pool, 'com.proposal_versions')).toBe(true);
    expect(await tableExists(pool, 'com.proposal_items')).toBe(true);
    expect(await tableExists(pool, 'com.proposal_document_links')).toBe(true);
  });
});
