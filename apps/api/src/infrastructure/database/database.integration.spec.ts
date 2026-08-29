import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const FORBIDDEN_BUSINESS_TABLES = [
  'users',
  'user',
  'clients',
  'client',
  'customers',
  'customer',
  'service_orders',
  'service_order',
  'os',
  'resources',
  'resource',
  'documents',
  'document',
  'purchase_orders',
  'purchase_order',
  'po',
  'measurements',
  'measurement',
  'invoices',
  'invoice',
  'billing',
  'payments',
  'payment',
  'audit_log',
  'audit_logs',
  'business_audit',
] as const;

const ALLOWED_TECHNICAL_TABLES = new Set([
  'schema_baseline',
  '__drizzle_migrations',
  'identities',
  'credentials',
  'sessions',
  'refresh_token_families',
  'refresh_tokens',
  'grants',
  'decision_audits',
  'scope_refs',
  'scoped_records',
]);

const ALLOWED_SCHEMAS = new Set(['infrastructure', 'identity', 'authorization', 'public']);

describe('PostgreSQL integration', () => {
  let pool: Pool;
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];

  beforeAll(() => {
    if (!testDatabaseUrl) {
      throw new Error(
        'TEST_DATABASE_URL is required for integration tests. Start docker compose and copy .env.example.',
      );
    }

    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('connects and runs an isolated transaction that rolls back', async () => {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const result = await client.query<{ value: number }>('SELECT 1 AS value');
      expect(result.rows[0]?.value).toBe(1);
      await client.query('ROLLBACK');

      const afterRollback = await client.query<{ in_txn: boolean }>(
        "SELECT current_setting('transaction_isolation') IS NOT NULL AS in_txn",
      );
      expect(afterRollback.rows[0]).toBeDefined();
    } finally {
      client.release();
    }
  });

  it('reports PostgreSQL 18.x', async () => {
    const result = await pool.query<{ version: string }>(
      "SELECT current_setting('server_version') AS version",
    );
    const version = result.rows[0]?.version ?? '';
    expect(version).toMatch(/^18\./);
  });

  it('does not contain business tables', async () => {
    const result = await pool.query<{ schemaname: string; tablename: string }>(
      `SELECT schemaname, tablename
       FROM pg_tables
       WHERE schemaname IN ('public', 'infrastructure', 'identity')
       ORDER BY schemaname, tablename`,
    );

    for (const row of result.rows) {
      const tableName = row.tablename.toLowerCase();
      expect(FORBIDDEN_BUSINESS_TABLES).not.toContain(tableName);
      expect(ALLOWED_SCHEMAS.has(row.schemaname)).toBe(true);
      if (row.schemaname === 'public') {
        expect(ALLOWED_TECHNICAL_TABLES.has(tableName)).toBe(true);
      }
    }
  });
});
