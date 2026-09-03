import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Client, Pool } from 'pg';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const MIGRATIONS_DIR = resolve(packageRoot, 'migrations');

export const MIGRATION_FILES = readdirSync(MIGRATIONS_DIR)
  .filter((file) => file.endsWith('.sql'))
  .sort();

export function quoteIdent(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export function databaseUrlForName(adminUrl: string, databaseName: string): string {
  const parsed = new URL(adminUrl);
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
}

export async function recreateDatabase(adminClient: Client, databaseName: string): Promise<void> {
  await adminClient.query(
    `SELECT pg_terminate_backend(pid)
     FROM pg_stat_activity
     WHERE datname = $1
       AND pid <> pg_backend_pid()`,
    [databaseName],
  );

  const exists = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [
    databaseName,
  ]);
  if ((exists.rowCount ?? 0) > 0) {
    await adminClient.query(`DROP DATABASE ${quoteIdent(databaseName)}`);
  }
  await adminClient.query(`CREATE DATABASE ${quoteIdent(databaseName)}`);
}

export async function applySqlFile(client: Pick<Pool | Client, 'query'>, relativePath: string): Promise<void> {
  const filePath = resolve(MIGRATIONS_DIR, relativePath);
  const sql = readFileSync(filePath, 'utf8');
  const statements = sql
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  for (const statement of statements) {
    await client.query(statement);
  }
}

export async function applyMigrations(
  connectionString: string,
  files: readonly string[],
): Promise<void> {
  const { Client } = await import('pg');
  const client = new Client({ connectionString });
  await client.connect();
  try {
    for (const file of files) {
      await applySqlFile(client, file);
    }
  } finally {
    await client.end();
  }
}

export async function assertSmokeSchema(connectionString: string): Promise<void> {
  const { Client } = await import('pg');
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const baseline = await client.query<{ baseline_version: string }>(
      `SELECT baseline_version
       FROM infrastructure.schema_baseline
       ORDER BY id
       LIMIT 1`,
    );
    if (!baseline.rows[0]?.baseline_version) {
      throw new Error('Smoke failed: infrastructure.schema_baseline seed missing');
    }

    const requiredTables = [
      'pty.clients',
      'pty.suppliers',
      'prc.purchase_requests',
      'prc.supplier_purchase_orders',
      'prc.goods_receipts',
      'prc.supplier_invoices',
      'prc.three_way_matches',
      'authorization.approval_matrices',
      'fin.expenses',
      'fin.receivable_collections',
      'cat.service_definitions',
      'ast.physical_assets',
      'sr.service_requests',
      'com.proposals',
      'com.purchase_orders',
      'so.service_orders',
      'so.execution_entries',
      'msr.measurements',
      'bil.billing_records',
      'fin.receivables',
      'fin.payables',
      'fin.financial_accounts',
      'acc.journal_entries',
      'fis.fiscal_documents',
      'fis.tax_rules',
      'inv.inventory_items',
      'inv.costing_rules',
      'pay.employment_contracts',
      'fin.bank_statements',
      'fin.bank_statement_imports',
      'acc.period_close_policies',
      'fis.tax_assessments',
      'fis.tax_obligations',
      'fis.fiscal_periods',
      'acc.accounting_posting_rules',
      'acc.accounting_posting_requests',
      'acc.fixed_asset_registers',
      'acc.fixed_asset_movements',
      'fin.budgets',
      'fin.budget_versions',
      'fin.budget_periods',
      'fin.budget_lines',
      'doc.documents',
      'rpt.report_exports',
      'alt.business_alerts',
    ];

    for (const qualifiedTable of requiredTables) {
      const result = await client.query<{ regclass: string | null }>(
        'SELECT to_regclass($1) AS regclass',
        [qualifiedTable],
      );
      if (!result.rows[0]?.regclass) {
        throw new Error(`Smoke failed: missing table ${qualifiedTable}`);
      }
    }
  } finally {
    await client.end();
  }
}
