import {
  authHeaders,
  BACKOFFICE_PROBE_ID,
  jsonHeaders,
  probeReadAccess,
  requestJson,
} from '../../financial-ui/enterprise-api';
import type { SupplierDetail, SupplierHistoryItem } from '../types/supplier.types';

export async function getSupplier(supplierId: string, signal?: AbortSignal): Promise<SupplierDetail> {
  return requestJson<SupplierDetail>(`/api/v1/suppliers/${supplierId}`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function getSupplierHistory(
  supplierId: string,
  signal?: AbortSignal,
): Promise<SupplierHistoryItem[]> {
  return requestJson<SupplierHistoryItem[]>(`/api/v1/suppliers/${supplierId}/history`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function createSupplier(payload: Record<string, unknown>): Promise<SupplierDetail> {
  return requestJson<SupplierDetail>('/api/v1/suppliers', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function activateSupplier(supplierId: string, payload: { version: number }): Promise<SupplierDetail> {
  return requestJson<SupplierDetail>(`/api/v1/suppliers/${supplierId}/activate`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function deactivateSupplier(
  supplierId: string,
  payload: { version: number; reason?: string },
): Promise<SupplierDetail> {
  return requestJson<SupplierDetail>(`/api/v1/suppliers/${supplierId}/deactivate`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updateSupplier(
  supplierId: string,
  payload: Record<string, unknown>,
): Promise<SupplierDetail> {
  return requestJson<SupplierDetail>(`/api/v1/suppliers/${supplierId}`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function probeSupplierReadAccess(signal?: AbortSignal): Promise<boolean> {
  return probeReadAccess(`/api/v1/suppliers/${BACKOFFICE_PROBE_ID}`, signal);
}
