import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationsDir = join(__dirname, '../migrations');
const journalPath = join(migrationsDir, 'meta/_journal.json');
const sqlFile = /^\d{4}_.+\.sql$/;

function listSqlFiles(): string[] {
  return readdirSync(migrationsDir)
    .filter((name) => sqlFile.test(name))
    .sort();
}

describe('drizzle migration journal completeness', () => {
  it('lists every SQL migration in _journal.json with sequential idx', () => {
    const sqlFiles = listSqlFiles();
    const journal = JSON.parse(readFileSync(journalPath, 'utf8')) as {
      entries: Array<{ idx: number; tag: string }>;
    };
    const journalFiles = journal.entries.map((entry) => `${entry.tag}.sql`);

    expect(journalFiles).toEqual(sqlFiles);
    expect(journal.entries.map((entry) => entry.idx)).toEqual(sqlFiles.map((_, idx) => idx));
  });
});
