import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export async function truncateFiscalTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      fis.fiscal_period_close_check_results,
      fis.fiscal_period_close_runs,
      fis.fiscal_periods,
      fis.tax_assessment_events,
      fis.tax_obligations,
      fis.tax_assessments,
      fis.tax_calculation_lines,
      fis.tax_calculations,
      fis.tax_contexts,
      fis.tax_rule_versions,
      fis.tax_rules,
      fis.fiscal_authorizations,
      fis.fiscal_events,
      fis.fiscal_tax_details,
      fis.fiscal_party_snapshots,
      fis.fiscal_document_items,
      fis.fiscal_documents
    RESTART IDENTITY CASCADE
  `);
}
