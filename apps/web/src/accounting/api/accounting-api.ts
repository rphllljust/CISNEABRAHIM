import {
  authHeaders,
  BACKOFFICE_PROBE_ID,
  BackofficeApiError,
  jsonHeaders,
  probeReadAccess,
  requestJson,
} from '../../financial-ui/enterprise-api';
import type {
  AccountingPeriod,
  ChartOfAccounts,
  GeneralLedger,
  JournalBook,
  JournalEntry,
  LedgerReconstruction,
  IncomeStatement,
  BalanceSheet,
  TrialBalance,
} from '../types/accounting.types';

export { BackofficeApiError };

export async function getChart(chartId: string, signal?: AbortSignal): Promise<ChartOfAccounts> {
  return requestJson<ChartOfAccounts>(`/api/v1/accounting/charts/${chartId}`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function reconstructLedger(chartId: string, signal?: AbortSignal): Promise<LedgerReconstruction> {
  return requestJson<LedgerReconstruction>(
    `/api/v1/accounting/ledger?chartId=${encodeURIComponent(chartId)}`,
    { method: 'GET', headers: authHeaders(), signal },
  );
}

export async function getJournal(journalId: string, signal?: AbortSignal): Promise<JournalEntry> {
  return requestJson<JournalEntry>(`/api/v1/accounting/journals/${journalId}`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function postJournal(
  journalId: string,
  payload: { rowVersion: number },
): Promise<JournalEntry> {
  return requestJson<JournalEntry>(`/api/v1/accounting/journals/${journalId}/post`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function reverseJournal(
  journalId: string,
  payload: { rowVersion: number; reason: string },
): Promise<JournalEntry> {
  return requestJson<JournalEntry>(`/api/v1/accounting/journals/${journalId}/reverse`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function getJournalBook(periodId: string, signal?: AbortSignal): Promise<JournalBook> {
  return requestJson<JournalBook>(`/api/v1/accounting/periods/${periodId}/journal`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function getGeneralLedger(periodId: string, signal?: AbortSignal): Promise<GeneralLedger> {
  return requestJson<GeneralLedger>(`/api/v1/accounting/periods/${periodId}/general-ledger`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function getTrialBalance(periodId: string, signal?: AbortSignal): Promise<TrialBalance> {
  return requestJson<TrialBalance>(`/api/v1/accounting/periods/${periodId}/trial-balance`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function getIncomeStatement(
  periodId: string,
  signal?: AbortSignal,
): Promise<IncomeStatement> {
  return requestJson<IncomeStatement>(`/api/v1/accounting/periods/${periodId}/income-statement`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function getBalanceSheet(periodId: string, signal?: AbortSignal): Promise<BalanceSheet> {
  return requestJson<BalanceSheet>(`/api/v1/accounting/periods/${periodId}/balance-sheet`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function closePeriod(
  periodId: string,
  payload: { rowVersion: number; reason: string },
): Promise<AccountingPeriod> {
  return requestJson<AccountingPeriod>(`/api/v1/accounting/periods/${periodId}/close`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function reopenPeriod(
  periodId: string,
  payload: { rowVersion: number; reason: string },
): Promise<AccountingPeriod> {
  return requestJson<AccountingPeriod>(`/api/v1/accounting/periods/${periodId}/reopen`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function probeAccountingReadAccess(signal?: AbortSignal): Promise<boolean> {
  return probeReadAccess(`/api/v1/accounting/charts/${BACKOFFICE_PROBE_ID}`, signal);
}
