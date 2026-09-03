import {
  authHeaders,
  BACKOFFICE_PROBE_ID,
  BackofficeApiError,
  jsonHeaders,
  probeReadAccess,
  requestJson,
} from '../../financial-ui/enterprise-api';
import type { FiscalDocument, TaxCalculation, TaxReproduction, TaxRule } from '../types/fiscal.types';

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
