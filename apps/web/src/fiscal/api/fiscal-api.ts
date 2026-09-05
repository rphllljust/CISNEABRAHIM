import {
  authHeaders,
  BACKOFFICE_PROBE_ID,
  BackofficeApiError,
  jsonHeaders,
  probeReadAccess,
  requestJson,
} from '../../financial-ui/enterprise-api';
import type { FiscalDocument, TaxCalculation, TaxReproduction, TaxRule, FiscalPeriod, TaxAssessment } from '../types/fiscal.types';

export { BackofficeApiError };

export async function getFiscalDocument(fiscalDocumentId: string, signal?: AbortSignal): Promise<FiscalDocument> {
  return requestJson<FiscalDocument>(`/api/v1/fiscal/documents/${fiscalDocumentId}`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function markFiscalDocumentReady(
  fiscalDocumentId: string,
  payload: { rowVersion: number },
): Promise<FiscalDocument> {
  return requestJson<FiscalDocument>(`/api/v1/fiscal/documents/${fiscalDocumentId}/ready`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function submitFiscalDocument(
  fiscalDocumentId: string,
  payload: { rowVersion: number },
): Promise<FiscalDocument> {
  return requestJson<FiscalDocument>(`/api/v1/fiscal/documents/${fiscalDocumentId}/submit`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function cancelFiscalDocument(
  fiscalDocumentId: string,
  payload: { rowVersion: number; reason: string },
): Promise<FiscalDocument> {
  return requestJson<FiscalDocument>(`/api/v1/fiscal/documents/${fiscalDocumentId}/cancel`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function getTaxRule(taxRuleId: string, signal?: AbortSignal): Promise<TaxRule> {
  return requestJson<TaxRule>(`/api/v1/fiscal/tax/rules/${taxRuleId}`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function getTaxCalculation(calculationId: string, signal?: AbortSignal): Promise<TaxCalculation> {
  return requestJson<TaxCalculation>(`/api/v1/fiscal/tax/calculations/${calculationId}`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function reproduceTaxCalculation(calculationId: string): Promise<TaxReproduction> {
  return requestJson<TaxReproduction>(`/api/v1/fiscal/tax/calculations/${calculationId}/reproduce`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({}),
  });
}

export async function probeFiscalDocumentReadAccess(signal?: AbortSignal): Promise<boolean> {
  return probeReadAccess(`/api/v1/fiscal/documents/${BACKOFFICE_PROBE_ID}`, signal);
}

export async function probeTaxReadAccess(signal?: AbortSignal): Promise<boolean> {
  return probeReadAccess(`/api/v1/fiscal/tax/calculations/${BACKOFFICE_PROBE_ID}`, signal);
}

export async function getFiscalPeriod(periodId: string, signal?: AbortSignal): Promise<FiscalPeriod> {
  return requestJson<FiscalPeriod>(`/api/v1/fiscal/periods/${periodId}`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function openFiscalPeriod(payload: { unitId: string; periodKey: string }): Promise<FiscalPeriod> {
  return requestJson<FiscalPeriod>('/api/v1/fiscal/periods', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function closeFiscalPeriod(periodId: string): Promise<FiscalPeriod> {
  return requestJson<FiscalPeriod>(`/api/v1/fiscal/periods/${periodId}/close`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({}),
  });
}

export async function reopenFiscalPeriod(periodId: string, payload: { reason: string }): Promise<FiscalPeriod> {
  return requestJson<FiscalPeriod>(`/api/v1/fiscal/periods/${periodId}/reopen`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function getTaxAssessment(assessmentId: string, signal?: AbortSignal): Promise<TaxAssessment> {
  return requestJson<TaxAssessment>(`/api/v1/fiscal/tax/assessments/${assessmentId}`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function createTaxAssessment(payload: Record<string, unknown>): Promise<TaxAssessment> {
  return requestJson<TaxAssessment>('/api/v1/fiscal/tax/assessments', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function finalizeTaxAssessment(
  assessmentId: string,
  payload: Record<string, unknown>,
): Promise<TaxAssessment> {
  return requestJson<TaxAssessment>(`/api/v1/fiscal/tax/assessments/${assessmentId}/finalize`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function adjustTaxAssessment(
  assessmentId: string,
  payload: Record<string, unknown>,
): Promise<TaxAssessment> {
  return requestJson<TaxAssessment>(`/api/v1/fiscal/tax/assessments/${assessmentId}/adjust`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function cancelTaxAssessment(
  assessmentId: string,
  payload: { reason: string },
): Promise<TaxAssessment> {
  return requestJson<TaxAssessment>(`/api/v1/fiscal/tax/assessments/${assessmentId}/cancel`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function probeFiscalPeriodReadAccess(signal?: AbortSignal): Promise<boolean> {
  return probeReadAccess(`/api/v1/fiscal/periods/${BACKOFFICE_PROBE_ID}`, signal);
}
