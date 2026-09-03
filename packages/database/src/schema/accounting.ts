import { boolean, date, integer, numeric, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { identities } from './identity';

export const accSchema = pgSchema('acc');

export const chartStatusEnum = accSchema.enum('chart_status', ['ACTIVE', 'INACTIVE']);

export const accountClassEnum = accSchema.enum('account_class', [
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'REVENUE',
  'EXPENSE',
]);

export const accountStatusEnum = accSchema.enum('account_status', ['ACTIVE', 'INACTIVE']);

export const periodStatusEnum = accSchema.enum('period_status', ['OPEN', 'CLOSED']);
export const periodCloseRunStatusEnum = accSchema.enum('period_close_run_status', [
  'SUCCEEDED',
  'BLOCKED',
]);
export const periodCloseCheckKindEnum = accSchema.enum('period_close_check_kind', [
  'RECEIVABLES',
  'PAYABLES',
  'TREASURY',
  'BANK_RECONCILIATION',
  'FISCAL',
  'ACCOUNTING',
  'DEBIT_CREDIT',
  'PENDING_POSTING',
  'DUPLICATE_ECONOMIC_EVENT',
  'ORIGIN_CONSISTENCY',
]);
export const periodCloseCheckResultEnum = accSchema.enum('period_close_check_result', [
  'PASS',
  'FAIL',
  'INFORMATIONAL',
]);

export const journalStatusEnum = accSchema.enum('journal_status', ['DRAFT', 'POSTED']);

export const journalKindEnum = accSchema.enum('journal_kind', ['ENTRY', 'REVERSAL']);

export const journalDirectionEnum = accSchema.enum('journal_direction', ['DEBIT', 'CREDIT']);

export const journalSourceKindEnum = accSchema.enum('journal_source_kind', [
  'MANUAL',
  'BILLING',
  'SETTLEMENT',
  'PAYMENT',
  'INVENTORY',
  'PAYROLL',
  'TAX',
  'FIXED_ASSET',
]);

export const chartsOfAccounts = accSchema.table('charts_of_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: text('unit_id').notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  status: chartStatusEnum('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
  updatedByIdentityId: uuid('updated_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const accountingAccounts = accSchema.table('accounting_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  chartId: uuid('chart_id')
    .notNull()
    .references(() => chartsOfAccounts.id),
  parentId: uuid('parent_id'),
  code: text('code').notNull(),
  name: text('name').notNull(),
  class: accountClassEnum('class').notNull(),
  status: accountStatusEnum('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
  updatedByIdentityId: uuid('updated_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const accountingPeriods = accSchema.table('accounting_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  chartId: uuid('chart_id')
    .notNull()
    .references(() => chartsOfAccounts.id),
  unitId: text('unit_id').notNull(),
  code: text('code').notNull(),
  startsOn: date('starts_on').notNull(),
  endsOn: date('ends_on').notNull(),
  status: periodStatusEnum('status').notNull().default('OPEN'),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  closedByIdentityId: uuid('closed_by_identity_id').references(() => identities.id),
  closeReason: text('close_reason'),
  reopenedAt: timestamp('reopened_at', { withTimezone: true }),
  reopenedByIdentityId: uuid('reopened_by_identity_id').references(() => identities.id),
  reopenReason: text('reopen_reason'),
  reopenCount: integer('reopen_count').notNull().default(0),
  rowVersion: integer('row_version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
  updatedByIdentityId: uuid('updated_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const periodClosePolicies = accSchema.table('period_close_policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: text('unit_id').notNull(),
  chartId: uuid('chart_id')
    .notNull()
    .references(() => chartsOfAccounts.id),
  requireTrialBalanceBalanced: boolean('require_trial_balance_balanced').notNull().default(true),
  requireNoDraftJournals: boolean('require_no_draft_journals').notNull().default(true),
  requireNoCriticalPendingPostings: boolean('require_no_critical_pending_postings')
    .notNull()
    .default(true),
  requireNoDuplicateEconomicEvents: boolean('require_no_duplicate_economic_events')
    .notNull()
    .default(true),
  requireOriginConsistency: boolean('require_origin_consistency').notNull().default(true),
  requireBankReconciliationIntegrity: boolean('require_bank_reconciliation_integrity')
    .notNull()
    .default(true),
  requireReceivablesSettled: boolean('require_receivables_settled').notNull().default(false),
  requirePayablesSettled: boolean('require_payables_settled').notNull().default(false),
  requireAllBankLinesMatched: boolean('require_all_bank_lines_matched').notNull().default(false),
  requireFiscalDocumentsAuthorized: boolean('require_fiscal_documents_authorized')
    .notNull()
    .default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
  updatedByIdentityId: uuid('updated_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const periodCloseRuns = accSchema.table('period_close_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  periodId: uuid('period_id')
    .notNull()
    .references(() => accountingPeriods.id),
  policyId: uuid('policy_id')
    .notNull()
    .references(() => periodClosePolicies.id),
  status: periodCloseRunStatusEnum('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const periodCloseCheckResults = accSchema.table('period_close_check_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  closeRunId: uuid('close_run_id')
    .notNull()
    .references(() => periodCloseRuns.id),
  kind: periodCloseCheckKindEnum('kind').notNull(),
  result: periodCloseCheckResultEnum('result').notNull(),
  blocking: boolean('blocking').notNull(),
  observedCount: integer('observed_count').notNull().default(0),
  detail: text('detail').notNull(),
});

export const journalEntries = accSchema.table('journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  chartId: uuid('chart_id')
    .notNull()
    .references(() => chartsOfAccounts.id),
  periodId: uuid('period_id')
    .notNull()
    .references(() => accountingPeriods.id),
  unitId: text('unit_id').notNull(),
  status: journalStatusEnum('status').notNull().default('DRAFT'),
  kind: journalKindEnum('kind').notNull().default('ENTRY'),
  description: text('description').notNull(),
  occurredOn: date('occurred_on').notNull(),
  currencyCode: text('currency_code').notNull(),
  sourceKind: journalSourceKindEnum('source_kind').notNull(),
  sourceId: uuid('source_id').notNull(),
  sourceReference: text('source_reference').notNull(),
  idempotencyKey: text('idempotency_key').notNull(),
  reversesEntryId: uuid('reverses_entry_id'),
  postedAt: timestamp('posted_at', { withTimezone: true }),
  postedByIdentityId: uuid('posted_by_identity_id').references(() => identities.id),
  rowVersion: integer('row_version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
  updatedByIdentityId: uuid('updated_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const journalEntryLines = accSchema.table('journal_entry_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  journalEntryId: uuid('journal_entry_id')
    .notNull()
    .references(() => journalEntries.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accountingAccounts.id),
  direction: journalDirectionEnum('direction').notNull(),
  amount: numeric('amount', { precision: 18, scale: 4 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const fixedAssetStatusEnum = accSchema.enum('fixed_asset_status', [
  'REGISTERED',
  'CAPITALIZED',
  'DISPOSED',
]);

export const fixedAssetMovementKindEnum = accSchema.enum('fixed_asset_movement_kind', [
  'ACQUISITION',
  'DISPOSAL',
  'TRANSFER',
  'DEPRECIATION',
]);

export const fixedAssetMovementStatusEnum = accSchema.enum('fixed_asset_movement_status', [
  'POSTED',
  'REVERSED',
]);

export const fixedAssetRegisters = accSchema.table('fixed_asset_registers', {
  id: uuid('id').primaryKey().defaultRandom(),
  unitId: text('unit_id').notNull(),
  operationalAssetId: uuid('operational_asset_id').notNull(),
  currencyCode: text('currency_code').notNull(),
  usefulLifeMonths: integer('useful_life_months').notNull(),
  costCenterCode: text('cost_center_code'),
  status: fixedAssetStatusEnum('status').notNull().default('REGISTERED'),
  rowVersion: integer('row_version').notNull().default(1),
  acquiredOn: date('acquired_on'),
  disposedOn: date('disposed_on'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
  updatedByIdentityId: uuid('updated_by_identity_id')
    .notNull()
    .references(() => identities.id),
});

export const fixedAssetMovements = accSchema.table('fixed_asset_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  registerId: uuid('register_id')
    .notNull()
    .references(() => fixedAssetRegisters.id),
  kind: fixedAssetMovementKindEnum('kind').notNull(),
  status: fixedAssetMovementStatusEnum('status').notNull().default('POSTED'),
  amount: numeric('amount', { precision: 18, scale: 4 }).notNull(),
  currencyCode: text('currency_code').notNull(),
  occurredOn: date('occurred_on').notNull(),
  fromCostCenterCode: text('from_cost_center_code'),
  toCostCenterCode: text('to_cost_center_code'),
  journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id),
  postingRequestId: uuid('posting_request_id'),
  reversedMovementId: uuid('reversed_movement_id'),
  idempotencyKey: text('idempotency_key').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdByIdentityId: uuid('created_by_identity_id')
    .notNull()
    .references(() => identities.id),
});
