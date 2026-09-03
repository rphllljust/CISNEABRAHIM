import type { Pool, PoolClient } from 'pg';

type DbClient = Pool | PoolClient;

export async function truncatePayrollTables(client: DbClient): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      pay.payroll_results,
      pay.payroll_calculations,
      pay.payroll_events,
      pay.payroll_periods,
      pay.employment_contracts
    RESTART IDENTITY CASCADE
  `);
}
