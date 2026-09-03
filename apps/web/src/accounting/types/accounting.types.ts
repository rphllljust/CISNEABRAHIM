export type ChartOfAccounts = {
  id: string;
  unitId: string;
  code: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type PeriodCloseCheck = {
  kind: string;
  result: string;
  blocking: boolean;
  observedCount: number;
  detail: string;
};

export type AccountingPeriod = {
  id: string;
  chartId: string;
  unitId: string;
  code: string;
  startsOn: string;
  endsOn: string;
  status: string;
  reopenCount: number;
  rowVersion: number;
  closedAt: string | null;
  reopenedAt: string | null;
  closeChecks: PeriodCloseCheck[];
};

export type JournalLine = {
  id: string;
  lineNumber: number;
  accountId: string;
  direction: string;
  amount: string;
  description: string | null;
};

export type JournalEntry = {
  id: string;
  chartId: string;
  periodId: string;
  unitId: string;
  status: string;
  kind: string;
  description: string;
  occurredOn: string;
  currencyCode: string;
  sourceKind: string;
  sourceId: string;
  sourceReference: string;
  idempotencyKey: string;
  reversesEntryId: string | null;
  postedAt: string | null;
  rowVersion: number;
  debitTotal: string;
  creditTotal: string;
  balanced: boolean;
  lines: JournalLine[];
};

export type LedgerReconstruction = {
  chartId: string;
  totalDebits: string;
  totalCredits: string;
  balanced: boolean;
  accounts: Array<{ accountId: string; debits: string; credits: string }>;
};

export type JournalBook = {
  periodId: string;
  source: string;
  entries: JournalEntry[];
  totalDebits: string;
  totalCredits: string;
  difference: string;
  balanced: boolean;
};

export type GeneralLedger = {
  periodId: string;
  source: string;
  accounts: Array<{
    accountId: string;
    code: string;
    name: string;
    class: string;
    openingDebits: string;
    openingCredits: string;
    periodDebits: string;
    periodCredits: string;
    closingDebits: string;
    closingCredits: string;
    closingBalanceDebit: string;
    closingBalanceCredit: string;
    movements: Array<{
      journalEntryId: string;
      occurredOn: string;
      description: string;
      sourceReference: string;
      kind: string;
      direction: string;
      amount: string;
    }>;
  }>;
};

export type TrialBalance = {
  periodId: string;
  source: string;
  accounts: Array<{
    accountId: string;
    code: string;
    name: string;
    class: string;
    debit: string;
    credit: string;
  }>;
  totalDebits: string;
  totalCredits: string;
  difference: string;
  balanced: boolean;
};

export type IncomeStatement = {
  periodId: string;
  source: string;
  available: boolean;
  revenue: string;
  expense: string;
  netIncome: string;
};

export type BalanceSheet = {
  periodId: string;
  source: string;
  available: boolean;
  assets: string;
  liabilities: string;
  equity: string;
  netIncome: string;
  balanced: boolean;
};
