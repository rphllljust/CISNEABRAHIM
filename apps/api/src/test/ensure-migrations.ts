import { config } from 'dotenv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';

config({ path: resolve(__dirname, '../../../../.env') });
if (!process.env['TEST_DATABASE_URL']) {
  config({ path: resolve(__dirname, '../../../../.env.example') });
}

async function tableExists(pool: pg.Pool, table: string): Promise<boolean> {
  const result = await pool.query<{ regclass: string | null }>(
    'SELECT to_regclass($1) AS regclass',
    [table],
  );
  return result.rows[0]?.regclass !== null;
}

async function applySqlFile(pool: pg.Pool, relativePath: string): Promise<void> {
  const filePath = resolve(__dirname, '../../../../packages/database/migrations', relativePath);
  const sql = readFileSync(filePath, 'utf8');
  const statements = sql
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes('already exists') ||
        message.includes('duplicate key') ||
        message.includes('duplicate_object')
      ) {
        continue;
      }
      throw error;
    }
  }
}

export default async function ensureMigrations(): Promise<void> {
  const testDatabaseUrl = process.env['TEST_DATABASE_URL'];
  if (!testDatabaseUrl) {
    return;
  }

  const pool = new pg.Pool({ connectionString: testDatabaseUrl });
  try {
    const hasScopedRecords = await tableExists(pool, '"authorization".scoped_records');
    if (hasScopedRecords) {
      return;
    }

    await applySqlFile(pool, '0003_contextual_scope_enums.sql');
    await applySqlFile(pool, '0004_contextual_scope_tables.sql');
  } finally {
    await pool.end();
  }
}
