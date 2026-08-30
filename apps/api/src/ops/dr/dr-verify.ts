import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Pool } from 'pg';
import { access } from 'node:fs/promises';
import type { DrCheck } from './dr-types';
import { DOCUMENT_INTEGRITY_SAMPLE_SIZE, listDocumentStorageKeys } from './object-storage-hydrate';

const EXPECTED_SCHEMAS = [
  'identity',
  'pty',
  'so',
  'msr',
  'bil',
  'doc',
];

export async function verifyMigrationConsistency(pool: Pool): Promise<DrCheck> {
  try {
    const schemas = await pool.query<{ schema_name: string }>(
      `SELECT schema_name FROM information_schema.schemata
       WHERE schema_name = ANY($1::text[])`,
      [EXPECTED_SCHEMAS],
    );
    const baseline = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM information_schema.tables
       WHERE table_schema = 'infrastructure' AND table_name = 'schema_baseline'`,
    );
    const hasBaseline = Number.parseInt(baseline.rows[0]?.count ?? '0', 10) > 0;
    const passed = schemas.rowCount === EXPECTED_SCHEMAS.length && hasBaseline;
    return {
      id: 'migration_consistency',
      label: 'Migration / schema consistency',
      passed,
      detail: passed
        ? `Schemas present (${schemas.rowCount}/${EXPECTED_SCHEMAS.length}) with infrastructure baseline`
        : `Missing schemas or infrastructure.schema_baseline (found ${schemas.rowCount})`,
    };
  } catch (error) {
    return {
      id: 'migration_consistency',
      label: 'Migration / schema consistency',
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function verifyReferentialIntegrity(pool: Pool): Promise<DrCheck> {
  try {
    const orphanDocuments = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM doc.document_versions dv
       LEFT JOIN doc.stored_objects s ON s.id = dv.stored_object_id
       WHERE s.id IS NULL`,
    );
    const orphanBillingDocs = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM bil.billing_documents bd
       LEFT JOIN doc.documents d ON d.id = bd.stored_document_id
       WHERE bd.stored_document_id IS NOT NULL AND d.id IS NULL`,
    );
    const docOrphans = Number.parseInt(orphanDocuments.rows[0]?.count ?? '0', 10);
    const billingOrphans = Number.parseInt(orphanBillingDocs.rows[0]?.count ?? '0', 10);
    const passed = docOrphans === 0 && billingOrphans === 0;
    return {
      id: 'referential_integrity',
      label: 'Referential integrity (documents)',
      passed,
      detail: passed
        ? 'No orphan document references'
        : `orphan_documents=${docOrphans}, orphan_billing_docs=${billingOrphans}`,
    };
  } catch (error) {
    return {
      id: 'referential_integrity',
      label: 'Referential integrity (documents)',
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function verifyDocumentObjectIntegrity(
  pool: Pool,
  objectStorageRoot: string,
  sampleSize = DOCUMENT_INTEGRITY_SAMPLE_SIZE,
): Promise<DrCheck> {
  try {
    const storageKeys = await listDocumentStorageKeys(pool, sampleSize);
    const missing: string[] = [];
    for (const storageKey of storageKeys) {
      const objectPath = join(objectStorageRoot, storageKey);
      try {
        await access(objectPath);
      } catch {
        missing.push(storageKey);
      }
    }
    return {
      id: 'document_object_integrity',
      label: 'Document storage keys resolve to objects',
      passed: missing.length === 0,
      detail:
        missing.length === 0
          ? `Verified ${storageKeys.length} sample storage keys`
          : `Missing objects: ${missing.join(', ')}`,
    };
  } catch (error) {
    return {
      id: 'document_object_integrity',
      label: 'Document storage keys resolve to objects',
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function verifyDomainSmoke(pool: Pool): Promise<DrCheck[]> {
  const queries: Array<{ id: string; label: string; sql: string }> = [
    { id: 'client_sample', label: 'Client records readable', sql: 'SELECT COUNT(*)::text AS count FROM pty.clients' },
    {
      id: 'service_order_sample',
      label: 'Service orders readable',
      sql: 'SELECT COUNT(*)::text AS count FROM so.service_orders',
    },
    {
      id: 'execution_sample',
      label: 'Execution entries readable',
      sql: 'SELECT COUNT(*)::text AS count FROM so.execution_entries',
    },
    {
      id: 'measurement_sample',
      label: 'Measurements readable',
      sql: 'SELECT COUNT(*)::text AS count FROM msr.measurements',
    },
    {
      id: 'billing_sample',
      label: 'Billing records readable',
      sql: 'SELECT COUNT(*)::text AS count FROM bil.billing_records',
    },
  ];

  const checks: DrCheck[] = [];
  for (const query of queries) {
    try {
      const result = await pool.query<{ count: string }>(query.sql);
      const count = Number.parseInt(result.rows[0]?.count ?? '0', 10);
      checks.push({
        id: query.id,
        label: query.label,
        passed: Number.isFinite(count),
        detail: `count=${count}`,
      });
    } catch (error) {
      checks.push({
        id: query.id,
        label: query.label,
        passed: false,
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return checks;
}

export async function verifyLoginCapability(pool: Pool): Promise<DrCheck> {
  try {
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM identity.identities WHERE status = 'active'`,
    );
    const count = Number.parseInt(result.rows[0]?.count ?? '0', 10);
    return {
      id: 'login_capability',
      label: 'Active identities available for login',
      passed: count > 0,
      detail: `active_identities=${count}`,
    };
  } catch (error) {
    return {
      id: 'login_capability',
      label: 'Active identities available for login',
      passed: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function runDrVerification(
  pool: Pool,
  objectStorageRoot: string | null,
): Promise<DrCheck[]> {
  const checks: DrCheck[] = [
    await verifyMigrationConsistency(pool),
    await verifyReferentialIntegrity(pool),
  ];
  if (objectStorageRoot) {
    checks.push(await verifyDocumentObjectIntegrity(pool, objectStorageRoot));
  }
  checks.push(...(await verifyDomainSmoke(pool)));
  checks.push(await verifyLoginCapability(pool));
  return checks;
}

export async function writeDrStatusFile(
  statusFilePath: string,
  result: import('./dr-types').DrDrillResult,
): Promise<void> {
  const { mkdir, writeFile } = await import('node:fs/promises');
  const { dirname } = await import('node:path');
  await mkdir(dirname(statusFilePath), { recursive: true });
  await writeFile(statusFilePath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
}

export async function readDrStatusFile(statusFilePath: string): Promise<import('./dr-types').DrDrillResult | null> {
  try {
    const raw = await readFile(statusFilePath, 'utf8');
    return JSON.parse(raw) as import('./dr-types').DrDrillResult;
  } catch {
    return null;
  }
}
