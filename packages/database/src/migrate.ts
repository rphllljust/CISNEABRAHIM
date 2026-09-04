/**
 * Runtime-safe migration runner for packaged/hermetic releases.
 *
 * Uses the same journal + SQL migrations (packages/database/migrations) and
 * the same bookkeeping table (`drizzle.__drizzle_migrations`) as drizzle-kit,
 * so a release artifact can apply migrations without the drizzle-kit dev
 * toolchain — only pg + drizzle-orm (production dependencies).
 *
 * Idempotent: already-applied migration files (tracked by hash) are skipped,
 * so re-running is a no-op.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate as drizzleMigrate } from 'drizzle-orm/node-postgres/migrator';
import type { Pool } from 'pg';

export type MigrateOutcome = {
  appliedMigrations: number;
  totalMigrations: number;
  migrationsFolder: string;
};

export function resolveMigrationsFolder(
  explicit: string | undefined,
  packageRoot = join(__dirname, '..'),
): string {
  if (explicit) {
    return explicit;
  }
  return join(packageRoot, 'migrations');
}

export function assertMigrationsFolder(folder: string): void {
  if (!existsSync(join(folder, 'meta', '_journal.json'))) {
    throw new Error(
      `CONFIGURATION_ERROR: drizzle migration journal not found under "${folder}". ` +
        'Point CISNE_MIGRATIONS_DIR at a directory containing meta/_journal.json.',
    );
  }
}

export async function runMigrations(input: {
  pool: Pool;
  migrationsFolder: string;
}): Promise<MigrateOutcome> {
  const { pool, migrationsFolder } = input;
  assertMigrationsFolder(migrationsFolder);

  const journal = JSON.parse(
    readFileSync(join(migrationsFolder, 'meta', '_journal.json'), 'utf8'),
  ) as { entries: Array<{ tag: string }> };
  const totalMigrations = journal.entries.length;
  const appliedBefore = await countAppliedMigrations(pool);

  const db = drizzle(pool);
  await drizzleMigrate(db, { migrationsFolder });

  const appliedAfter = await countAppliedMigrations(pool);
  return {
    appliedMigrations: Math.max(0, appliedAfter - appliedBefore),
    totalMigrations,
    migrationsFolder,
  };
}

async function countAppliedMigrations(pool: Pool): Promise<number> {
  try {
    const applied = await pool.query(`SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations`);
    return (applied.rows[0]?.count as number) ?? 0;
  } catch (error) {
    // 42P01 = undefined_table: the journal table does not exist yet (fresh DB).
    const code = (error as { code?: string })?.code;
    if (code === '42P01') {
      return 0;
    }
    throw error;
  }
}
