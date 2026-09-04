#!/usr/bin/env node
/**
 * Hermetic migration CLI — applies the bundled drizzle migrations to DATABASE_URL.
 *
 * Usage (release artifact or monorepo):
 *   node packages/database/dist/cli/run-migrate-cli.js
 * Env:
 *   DATABASE_URL          required PostgreSQL connection URL
 *   CISNE_MIGRATIONS_DIR  optional override for the migrations folder
 *                         (default: <package>/migrations relative to this file)
 *
 * Idempotent: safe to run repeatedly; only pending journal entries apply.
 */
import { Pool } from 'pg';
import { resolveMigrationsFolder, runMigrations } from '../migrate';

async function main(): Promise<void> {
  const databaseUrl = process.env['DATABASE_URL']?.trim();
  if (!databaseUrl) {
    console.error(
      'CONFIGURATION_ERROR\nDATABASE_URL is required to run migrations (postgres:// or postgresql:// URL).',
    );
    process.exit(1);
  }
  const migrationsFolder = resolveMigrationsFolder(process.env['CISNE_MIGRATIONS_DIR']);
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });

  try {
    const outcome = await runMigrations({ pool, migrationsFolder });
    console.log(
      `MIGRATIONS OK: applied=${outcome.appliedMigrations} total=${outcome.totalMigrations} folder=${outcome.migrationsFolder}`,
    );
  } catch (error) {
    console.error('MIGRATIONS FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
