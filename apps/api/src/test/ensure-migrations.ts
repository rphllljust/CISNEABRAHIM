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

async function columnExists(
  pool: pg.Pool,
  schema: string,
  table: string,
  column: string,
): Promise<boolean> {
  const result = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = $1
         AND table_name = $2
         AND column_name = $3
     ) AS exists`,
    [schema, table, column],
  );
  return result.rows[0]?.exists === true;
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
    if (!hasScopedRecords) {
      await applySqlFile(pool, '0003_contextual_scope_enums.sql');
      await applySqlFile(pool, '0004_contextual_scope_tables.sql');
    }

    const hasSecurityAudit = await tableExists(pool, 'audit.security_audit_events');
    if (!hasSecurityAudit) {
      await applySqlFile(pool, '0005_security_audit_events.sql');
    }

    const hasClients = await tableExists(pool, 'pty.clients');
    if (!hasClients) {
      await applySqlFile(pool, '0006_clients_baseline.sql');
    }

    const hasCatalog = await tableExists(pool, 'cat.service_definitions');
    if (!hasCatalog) {
      await applySqlFile(pool, '0007_service_catalog_baseline.sql');
    }

    const hasLineageVersion = await columnExists(pool, 'cat', 'service_definitions', 'version');
    if (!hasLineageVersion) {
      await applySqlFile(pool, '0008_service_definitions_lineage_version.sql');
    }

    const hasUnits = await tableExists(pool, 'cat.units_of_measure');
    if (!hasUnits) {
      await applySqlFile(pool, '0009_units_of_measure.sql');
    }

    const hasPhysicalResourceTypes = await tableExists(pool, 'cat.physical_resource_types');
    if (!hasPhysicalResourceTypes) {
      await applySqlFile(pool, '0010_physical_resource_types.sql');
    }

    const hasLaborTypes = await tableExists(pool, 'cat.operational_labor_types');
    if (!hasLaborTypes) {
      await applySqlFile(pool, '0011_operational_labor_types.sql');
    }

    const hasMeasurementBasis = await columnExists(pool, 'cat', 'service_definition_versions', 'measurement_basis');
    if (!hasMeasurementBasis) {
      await applySqlFile(pool, '0012_commercial_pricing_measurement.sql');
    }

    const hasObservationEvidenceKind = await pool.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1
         FROM pg_type t
         INNER JOIN pg_enum e ON e.enumtypid = t.oid
         INNER JOIN pg_namespace n ON n.oid = t.typnamespace
         WHERE n.nspname = 'cat'
           AND t.typname = 'evidence_kind'
           AND e.enumlabel = 'OBSERVATION'
       ) AS exists`,
    );
    if (!hasObservationEvidenceKind.rows[0]?.exists) {
      await applySqlFile(pool, '0013_execution_requirements.sql');
    }
  } finally {
    await pool.end();
  }
}
