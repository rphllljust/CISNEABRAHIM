import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import pg from 'pg';
import { getTestDatabaseUrl, loadVitestEnv } from './load-vitest-env';

loadVitestEnv();

const repoRoot = resolve(__dirname, '../../../../');
const journalPath = resolve(repoRoot, 'packages/database/migrations/meta/_journal.json');
const migrationsDir = resolve(repoRoot, 'packages/database/migrations');

function migrationFileHash(fileName: string): string {
  const content = readFileSync(join(migrationsDir, fileName), 'utf8');
  return createHash('sha256').update(content).digest('hex');
}

async function syncDrizzleJournal(pool: pg.Pool): Promise<void> {
  const journal = JSON.parse(readFileSync(journalPath, 'utf8')) as {
    entries: Array<{ tag: string; when: number }>;
  };
  const applied = await pool.query<{ hash: string }>('SELECT hash FROM drizzle.__drizzle_migrations');
  const appliedHashes = new Set(applied.rows.map((row) => row.hash));

  const hasScopedRecords = await tableExists(pool, '"authorization".scoped_records');
  if (!hasScopedRecords) {
    return;
  }

  for (const entry of journal.entries) {
    const hash = migrationFileHash(`${entry.tag}.sql`);
    if (appliedHashes.has(hash)) {
      continue;
    }
    await pool.query('INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)', [
      hash,
      entry.when,
    ]);
    appliedHashes.add(hash);
  }
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
  const testDatabaseUrl = getTestDatabaseUrl();
  if (!testDatabaseUrl) {
    return;
  }

  const pool = new pg.Pool({ connectionString: testDatabaseUrl });
  try {
    await syncDrizzleJournal(pool);

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

    const hasPhysicalAssets = await tableExists(pool, 'ast.physical_assets');
    if (!hasPhysicalAssets) {
      await applySqlFile(pool, '0014_physical_assets_baseline.sql');
    }

    const hasDocuments = await tableExists(pool, 'doc.documents');
    if (!hasDocuments) {
      await applySqlFile(pool, '0015_documents_baseline.sql');
    }

    const hasProposals = await tableExists(pool, 'com.proposals');
    if (!hasProposals) {
      await applySqlFile(pool, '0016_commercial_proposals_baseline.sql');
    }

    const hasPurchaseOrders = await tableExists(pool, 'com.purchase_orders');
    if (!hasPurchaseOrders) {
      await applySqlFile(pool, '0017_commercial_purchase_orders_baseline.sql');
    }

    const hasServiceRequests = await tableExists(pool, 'sr.service_requests');
    if (!hasServiceRequests) {
      await applySqlFile(pool, '0018_service_requests_baseline.sql');
    }

    const hasServiceOrders = await tableExists(pool, 'so.service_orders');
    if (!hasServiceOrders) {
      await applySqlFile(pool, '0019_service_orders_baseline.sql');
    }

    const hasPreparedAt = await columnExists(pool, 'so', 'service_orders', 'prepared_at');
    if (!hasPreparedAt) {
      await applySqlFile(pool, '0020_service_orders_state_transitions.sql');
    }

    const hasPlannedResources = await tableExists(pool, 'so.planned_resources');
    if (!hasPlannedResources) {
      await applySqlFile(pool, '0021_planning_allocation_baseline.sql');
    }

    const hasExecutionEntries = await tableExists(pool, 'so.execution_entries');
    if (!hasExecutionEntries) {
      await applySqlFile(pool, '0022_service_order_execution_baseline.sql');
    }

    const hasMeasurements = await tableExists(pool, 'msr.measurements');
    if (!hasMeasurements) {
      await applySqlFile(pool, '0023_measurement_baseline.sql');
    }

    const hasBillingRecords = await tableExists(pool, 'bil.billing_records');
    if (!hasBillingRecords) {
      await applySqlFile(pool, '0024_billing_baseline.sql');
    }

    const hasBillingDocuments = await tableExists(pool, 'bil.billing_documents');
    if (!hasBillingDocuments) {
      await applySqlFile(pool, '0025_billing_documents.sql');
    } else {
      await pool.query(`
        ALTER TABLE bil.billing_document_items
        DROP CONSTRAINT IF EXISTS billing_document_items_billing_item_id_fkey
      `);
      await pool.query(`
        ALTER TABLE bil.billing_document_items
        ADD CONSTRAINT billing_document_items_billing_item_id_fkey
        FOREIGN KEY (billing_item_id) REFERENCES bil.billing_items(id) ON DELETE SET NULL
      `);
    }

    const hasDomainEvents = await tableExists(pool, 'evt.domain_events');
    if (!hasDomainEvents) {
      await applySqlFile(pool, '0026_domain_events_notifications.sql');
    }

    const hasBackgroundJobs = await tableExists(pool, 'plt.background_jobs');
    if (!hasBackgroundJobs) {
      await applySqlFile(pool, '0027_background_jobs.sql');
    }

    const hasOutboxEvents = await tableExists(pool, 'evt.outbox_events');
    if (!hasOutboxEvents) {
      await applySqlFile(pool, '0028_transactional_outbox.sql');
    }

    const hasIntegrationInbox = await tableExists(pool, 'int.integration_inbox');
    if (!hasIntegrationInbox) {
      await applySqlFile(pool, '0029_integration_inbox.sql');
    }

    const hasNotifications = await tableExists(pool, 'ntf.notifications');
    if (!hasNotifications) {
      await applySqlFile(pool, '0030_notification_delivery.sql');
    }

    const hasBusinessAlerts = await tableExists(pool, 'alt.business_alerts');
    if (!hasBusinessAlerts) {
      await applySqlFile(pool, '0031_operational_business_alerts.sql');
    }

    const hasOperationalAlertScanJob = await pool.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1
         FROM pg_type t
         INNER JOIN pg_enum e ON e.enumtypid = t.oid
         INNER JOIN pg_namespace n ON n.oid = t.typnamespace
         WHERE n.nspname = 'plt'
           AND t.typname = 'background_job_kind'
           AND e.enumlabel = 'OPERATIONAL_ALERT_SCAN'
       ) AS exists`,
    );
    if (!hasOperationalAlertScanJob.rows[0]?.exists) {
      await applySqlFile(pool, '0032_background_job_operational_alert_scan.sql');
    }
  } finally {
    await pool.end();
  }
}
