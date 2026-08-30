import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '../..');

export function loadRepoEnv() {
  loadEnvFile(resolve(repoRoot, '.env.example'));
  loadEnvFile(resolve(repoRoot, '.env'));
}

export function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function getTestDatabaseUrl() {
  return process.env['TEST_DATABASE_URL']?.trim() || undefined;
}

export function migrationFileHash(relativePath) {
  const filePath = resolve(repoRoot, 'packages/database/migrations', relativePath);
  const content = readFileSync(filePath, 'utf8');
  return createHash('sha256').update(content).digest('hex');
}

export function readDrizzleJournal() {
  const journalPath = resolve(repoRoot, 'packages/database/migrations/meta/_journal.json');
  return JSON.parse(readFileSync(journalPath, 'utf8'));
}

export async function syncDrizzleJournal(pool) {
  const journal = readDrizzleJournal();
  const applied = await pool.query('SELECT hash FROM drizzle.__drizzle_migrations');
  const appliedHashes = new Set(applied.rows.map((row) => row.hash));

  const hasScopedRecords = await tableExists(pool, '"authorization".scoped_records');
  if (!hasScopedRecords) {
    return { inserted: 0, reason: 'baseline schema not detected' };
  }

  let inserted = 0;
  for (const entry of journal.entries) {
    const fileName = `${entry.tag}.sql`;
    const hash = migrationFileHash(fileName);
    if (appliedHashes.has(hash)) {
      continue;
    }
    await pool.query('INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)', [
      hash,
      entry.when,
    ]);
    appliedHashes.add(hash);
    inserted += 1;
  }

  return { inserted, reason: inserted > 0 ? 'journal backfilled' : 'journal already aligned' };
}

async function tableExists(pool, table) {
  const result = await pool.query('SELECT to_regclass($1) AS regclass', [table]);
  return result.rows[0]?.regclass !== null;
}
