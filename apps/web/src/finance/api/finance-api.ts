import {
  authHeaders,
  BACKOFFICE_PROBE_ID,
  BackofficeApiError,
  jsonHeaders,
  probeReadAccess,
  requestJson,
} from '../../financial-ui/enterprise-api';
import type {
  AutoMatchResult,
  BankStatement,
  FinancialAccount,
  PayableAgingResponse,
  PayableDetail,
  ReceivableDetail,
  ReconciliationMatch,
  TreasuryReconciliation,
} from '../types/finance.types';

export { BackofficeApiError };

export async function listReceivables(signal?: AbortSignal): Promise<ReceivableDetail[]> {
  return requestJson<ReceivableDetail[]>('/api/v1/finance/receivables', {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function getReceivable(receivableId: string, signal?: AbortSignal): Promise<ReceivableDetail> {
  return requestJson<ReceivableDetail>(`/api/v1/finance/receivables/${receivableId}`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function settleReceivable(
  receivableId: string,
  payload: { amount: string; rowVersion: number; idempotencyKey: string; installmentId?: string },
): Promise<ReceivableDetail> {
  return requestJson<ReceivableDetail>(`/api/v1/finance/receivables/${receivableId}/settlements`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function cancelReceivable(
  receivableId: string,
  payload: { rowVersion: number; cancelReason: string; idempotencyKey?: string },
): Promise<ReceivableDetail> {
  return requestJson<ReceivableDetail>(`/api/v1/finance/receivables/${receivableId}/cancel`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function listPayables(signal?: AbortSignal): Promise<PayableDetail[]> {
  return requestJson<PayableDetail[]>('/api/v1/finance/payables', {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function getPayablesAging(signal?: AbortSignal): Promise<PayableAgingResponse> {
  return requestJson<PayableAgingResponse>('/api/v1/finance/payables/aging', {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function getPayable(payableId: string, signal?: AbortSignal): Promise<PayableDetail> {
  return requestJson<PayableDetail>(`/api/v1/finance/payables/${payableId}`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function payPayable(
  payableId: string,
  payload: {
    amount: string;
    rowVersion: number;
    idempotencyKey: string;
    paymentReference: string;
    installmentId?: string;
  },
): Promise<PayableDetail> {
  return requestJson<PayableDetail>(`/api/v1/finance/payables/${payableId}/payments`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function cancelPayable(
  payableId: string,
  payload: { rowVersion: number; cancelReason: string; idempotencyKey?: string },
): Promise<PayableDetail> {
  return requestJson<PayableDetail>(`/api/v1/finance/payables/${payableId}/cancel`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function listTreasuryAccounts(signal?: AbortSignal): Promise<FinancialAccount[]> {
  return requestJson<FinancialAccount[]>('/api/v1/finance/treasury/accounts', {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function getTreasuryAccount(accountId: string, signal?: AbortSignal): Promise<FinancialAccount> {
  return requestJson<FinancialAccount>(`/api/v1/finance/treasury/accounts/${accountId}`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function getTreasuryReconciliation(
  accountId: string,
  signal?: AbortSignal,
): Promise<TreasuryReconciliation> {
  return requestJson<TreasuryReconciliation>(
    `/api/v1/finance/treasury/accounts/${accountId}/reconciliation`,
    { method: 'GET', headers: authHeaders(), signal },
  );
}

export async function getBankStatement(statementId: string, signal?: AbortSignal): Promise<BankStatement> {
  return requestJson<BankStatement>(`/api/v1/finance/bank-reconciliation/statements/${statementId}`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function importBankFile(payload: {
  unitId: string;
  financialAccountId: string;
  fileName: string;
  content: string;
  declaredFormat?: string | null;
  idempotencyKey?: string | null;
}): Promise<BankStatement> {
  return requestJson<BankStatement>('/api/v1/finance/bank-reconciliation/statements/import', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function autoMatchStatement(statementId: string): Promise<AutoMatchResult> {
  return requestJson<AutoMatchResult>(
    `/api/v1/finance/bank-reconciliation/statements/${statementId}/auto-match`,
    { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({}) },
  );
}

export async function confirmReconciliation(reconciliationId: string): Promise<ReconciliationMatch> {
  return requestJson<ReconciliationMatch>(
    `/api/v1/finance/bank-reconciliation/reconciliations/${reconciliationId}/confirm`,
    { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({}) },
  );
}

export async function probeReceivableListAccess(signal?: AbortSignal): Promise<boolean> {
  return probeList('/api/v1/finance/receivables', signal);
}

export async function probePayableListAccess(signal?: AbortSignal): Promise<boolean> {
  return probeList('/api/v1/finance/payables', signal);
}

export async function probeTreasuryListAccess(signal?: AbortSignal): Promise<boolean> {
  return probeList('/api/v1/finance/treasury/accounts', signal);
}

export async function probeReconciliationReadAccess(signal?: AbortSignal): Promise<boolean> {
  return probeReadAccess(
    `/api/v1/finance/bank-reconciliation/statements/${BACKOFFICE_PROBE_ID}`,
    signal,
  );
}

async function probeList(path: string, signal?: AbortSignal): Promise<boolean> {
  try {
    await requestJson<unknown>(path, { method: 'GET', headers: authHeaders(), signal });
    return true;
  } catch (error) {
    if (error instanceof BackofficeApiError) {
      if (error.status === 401) {
        throw error;
      }
      if (error.kind === 'denied') {
        return false;
      }
    }
    return false;
  }
}
