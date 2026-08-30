import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(resolve(import.meta.dirname, '../packages/database/package.json'));
const pg = require('pg');

const MIGRATION_FILES = [
  '0003_contextual_scope_enums.sql',
  '0004_contextual_scope_tables.sql',
];

async function tableExists(client, table) {
  const result = await client.query('SELECT to_regclass($1) AS regclass', [table]);
  return result.rows[0]?.regclass !== null;
}

async function applySqlFile(client, relativePath) {
  const filePath = resolve('packages/database/migrations', relativePath);
  const sql = readFileSync(filePath, 'utf8');
  const statements = sql
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  for (const statement of statements) {
    try {
      await client.query(statement);
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

export async function applyContextualScopeMigrations(connectionString) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const hasScopedRecords = await tableExists(client, '"authorization".scoped_records');
    if (hasScopedRecords) {
      return;
    }
    for (const file of MIGRATION_FILES) {
      await applySqlFile(client, file);
    }
  } finally {
    await client.end();
  }
}
