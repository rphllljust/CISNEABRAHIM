import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MIGRATIONS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../migrations');
export const JOURNAL_PATH = resolve(MIGRATIONS_DIR, 'meta/_journal.json');

const SQL_FILE = /^\d{4}_.+\.sql$/;

export function listMigrationSqlFiles() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => SQL_FILE.test(name))
    .sort();
}

export function readDrizzleJournal() {
  return JSON.parse(readFileSync(JOURNAL_PATH, 'utf8'));
}

export function journalTags() {
  return readDrizzleJournal().entries.map((entry) => `${entry.tag}.sql`);
}
