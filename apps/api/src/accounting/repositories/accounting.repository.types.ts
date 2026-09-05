export type ChartOfAccountsRow = {
  id: string;
  unit_id: string;
  code: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by_identity_id: string;
  updated_by_identity_id: string;
};

export type AccountingAccountRow = {
  id: string;
  chart_id: string;
  parent_id: string | null;
  code: string;
  name: string;
  class: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by_identity_id: string;
  updated_by_identity_id: string;
};

export type PeriodClosePolicyRow = {
  id: string;
  unit_id: string;
  chart_id: string;
  require_trial_balance_balanced: boolean;
  require_no_draft_journals: boolean;
  require_no_critical_pending_postings: boolean;
  require_no_duplicate_economic_events: boolean;
  require_origin_consistency: boolean;
  require_bank_reconciliation_integrity: boolean;
  require_receivables_settled: boolean;
  require_payables_settled: boolean;
  require_all_bank_lines_matched: boolean;
  require_fiscal_documents_authorized: boolean;
};

export type PeriodCloseRunRow = {
  id: string;
  period_id: string;
  policy_id: string;
  status: string;
};

export type AccountingPeriodRow = {
  id: string;
  chart_id: string;
  unit_id: string;
  code: string;
  starts_on: string;
  ends_on: string;
  status: string;
  closed_at: string | null;
  closed_by_identity_id: string | null;
  close_reason: string | null;
  reopened_at: string | null;
  reopened_by_identity_id: string | null;
  reopen_reason: string | null;
  reopen_count: number;
  row_version: number;
  created_at: string;
  updated_at: string;
  created_by_identity_id: string;
  updated_by_identity_id: string;
};

export type JournalEntryRow = {
  id: string;
  chart_id: string;
  period_id: string;
  unit_id: string;
  status: string;
  kind: string;
  description: string;
  occurred_on: string;
  currency_code: string;
  source_kind: string;
  source_id: string;
  source_reference: string;
  idempotency_key: string;
  reverses_entry_id: string | null;
  entry_number: number | null;
  posted_at: string | null;
  posted_by_identity_id: string | null;
  row_version: number;
  created_at: string;
  updated_at: string;
  created_by_identity_id: string;
  updated_by_identity_id: string;
};

export type JournalEntryLineRow = {
  id: string;
  journal_entry_id: string;
  line_number: number;
  account_id: string;
  direction: string;
  amount: string;
  description: string | null;
  created_at: string;
};

export type JournalAggregate = {
  entry: JournalEntryRow;
  lines: JournalEntryLineRow[];
};

export type CreateChartPersistenceInput = {
  unitId: string;
  code: string;
  name: string;
  actorIdentityId: string;
};

export type CreateAccountPersistenceInput = {
  chartId: string;
  parentId?: string;
  code: string;
  name: string;
  class: string;
  actorIdentityId: string;
};

export type CreatePeriodPersistenceInput = {
  chartId: string;
  unitId: string;
  code: string;
  startsOn: string;
  endsOn: string;
  actorIdentityId: string;
};

export type DraftJournalPersistenceInput = {
  chartId: string;
  periodId: string;
  description: string;
  occurredOn: string;
  currencyCode: string;
  sourceKind: string;
  sourceId: string;
  sourceReference: string;
  idempotencyKey: string;
  actorIdentityId: string;
  lines: Array<{
    lineNumber: number;
    accountId: string;
    direction: string;
    amount: string;
    description?: string | null;
  }>;
};

export type ReplaceJournalLinesPersistenceInput = {
  journalEntryId: string;
  rowVersion: number;
  actorIdentityId: string;
  lines: DraftJournalPersistenceInput['lines'];
};

export type PostJournalPersistenceInput = {
  journalEntryId: string;
  rowVersion: number;
  actorIdentityId: string;
};

export type ReverseJournalPersistenceInput = {
  journalEntryId: string;
  rowVersion: number;
  idempotencyKey: string;
  reason: string;
  actorIdentityId: string;
};

export type ClosePeriodPersistenceInput = {
  periodId: string;
  rowVersion: number;
  reason: string;
  actorIdentityId: string;
};

export type ReopenPeriodPersistenceInput = {
  periodId: string;
  rowVersion: number;
  reason: string;
  actorIdentityId: string;
};

export type PostedLineFactRow = {
  account_id: string;
  account_code: string;
  account_name: string;
  account_class: string;
  direction: string;
  amount: string;
};

export type LedgerMovementRow = {
  journal_entry_id: string;
  occurred_on: string;
  description: string;
  source_reference: string;
  kind: string;
  line_number: number;
  direction: string;
  amount: string;
  line_description: string | null;
};

export type EnrichedJournalLineRow = JournalEntryLineRow & {
  account_code: string;
  account_name: string;
  account_class: string;
  account_status: string;
};

export type AccountingJournalListItem = {
  entry: JournalEntryRow;
  lines: EnrichedJournalLineRow[];
};

export type JournalListPageInput = {
  chartId?: string;
  periodId?: string;
  status?: string;
  kind?: string;
  occurredFrom?: string;
  occurredTo?: string;
  sourceKind?: string;
  accountId?: string;
  page: number;
  pageSize: number;
};

export type JournalListPageResult = {
  items: AccountingJournalListItem[];
  total: number;
};

export type PeriodCloseRunDetailRow = {
  id: string;
  period_id: string;
  policy_id: string;
  status: string;
  created_at: string;
  created_by_identity_id: string;
};

export type PeriodCloseCheckDetailRow = {
  id: string;
  close_run_id: string;
  kind: string;
  result: string;
  blocking: boolean;
  observed_count: number;
  detail: string;
};

export type AccountPostability = {
  account: AccountingAccountRow | null;
  hasChildren: boolean;
};
