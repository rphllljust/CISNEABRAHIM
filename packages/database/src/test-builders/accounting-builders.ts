import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export async function truncateAccountingTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      acc.fixed_asset_movements,
      acc.fixed_asset_registers,
      acc.period_close_check_results,
      acc.period_close_runs,
      acc.period_close_policies,
      acc.accounting_posting_requests,
      acc.accounting_posting_rule_versions,
      acc.accounting_posting_rules,
      acc.journal_entry_lines,
      acc.journal_entries,
      acc.accounting_periods,
      acc.accounting_accounts,
      acc.charts_of_accounts
    RESTART IDENTITY CASCADE
  `);
}
