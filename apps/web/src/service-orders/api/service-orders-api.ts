import { getApiBaseUrl, isNetworkError } from '../../auth/api/auth-api';
import { tokenStore } from '../../auth/storage/token-store';
import {
  SERVICE_ORDERS_ERROR_CODES,
  type ServiceOrderDetail,
  type ServiceOrdersErrorCode,
} from '../types/service-order.types';

export type ServiceOrdersApiErrorKind =
  | 'denied'
  | 'not_found'
  | 'validation'
  | 'version_conflict'
  | 'invalid_state'
  | 'allocation_conflict'
  | 'network'
  | 'unknown';

export class ServiceOrdersApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly kind: ServiceOrdersApiErrorKind;

  constructor(status: number, code: string | undefined, kind: ServiceOrdersApiErrorKind) {
    super(kind);
    this.status = status;
    this.code = code;
    this.kind = kind;
  }
}

type ErrorBody = { code?: ServiceOrdersErrorCode; message?: string };

const PROBE_SERVICE_ORDER_ID = '00000000-0000-4000-8000-000000000010';

function classifyError(status: number, code: ServiceOrdersErrorCode | undefined): ServiceOrdersApiErrorKind {
  if (code === SERVICE_ORDERS_ERROR_CODES.DENIED || status === 403) {
    return 'denied';
  }
  if (code === SERVICE_ORDERS_ERROR_CODES.NOT_FOUND || status === 404) {
    return 'not_found';
  }
  if (code === SERVICE_ORDERS_ERROR_CODES.VERSION_CONFLICT) {
    return 'version_conflict';
  }
  if (code === SERVICE_ORDERS_ERROR_CODES.ALLOCATION_CONFLICT) {
    return 'allocation_conflict';
  }
  if (code === SERVICE_ORDERS_ERROR_CODES.INVALID_STATE) {
    return 'invalid_state';
  }
  if (code === SERVICE_ORDERS_ERROR_CODES.VALIDATION_FAILED || status === 400) {
    return 'validation';
  }
  return 'unknown';
}

async function parseError(response: Response): Promise<ServiceOrdersApiError> {
  let code: ServiceOrdersErrorCode | undefined;
  try {
    const body = (await response.json()) as ErrorBody;
    code = body.code;
  } catch {
    // ignore
  }
  return new ServiceOrdersApiError(response.status, code, classifyError(response.status, code));
}

function authHeaders(): HeadersInit {
  const accessToken = tokenStore.getAccessToken();
  if (!accessToken) {
    throw new ServiceOrdersApiError(401, undefined, 'denied');
  }
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

function jsonHeaders(): HeadersInit {
  return {
    ...authHeaders(),
    'Content-Type': 'application/json',
  };
}

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, init);
    if (!response.ok) {
      throw await parseError(response);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ServiceOrdersApiError) {
      throw error;
    }
    if (isNetworkError(error)) {
      throw new ServiceOrdersApiError(0, undefined, 'network');
    }
    throw new ServiceOrdersApiError(0, undefined, 'unknown');
  }
}

export async function getServiceOrder(
  serviceOrderId: string,
  signal?: AbortSignal,
): Promise<ServiceOrderDetail> {
  return requestJson<ServiceOrderDetail>(`/api/v1/service-orders/${serviceOrderId}`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export type ServiceOrderPlanningCapabilities = {
  canRead: boolean;
  canPlan: boolean;
  canUpdatePlan: boolean;
  canRemovePlan: boolean;
  canAllocate: boolean;
  canReallocate: boolean;
  canRemoveAllocation: boolean;
  canListAllocations: boolean;
};

async function probeMutation(
  path: string,
  method: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<boolean> {
  try {
    await requestJson(path, {
      method,
      headers: jsonHeaders(),
      body: JSON.stringify(body),
      signal,
    });
    return true;
  } catch (error) {
    if (error instanceof ServiceOrdersApiError && error.kind === 'denied') {
      return false;
    }
    return true;
  }
}

export async function probeServiceOrderListAccess(signal?: AbortSignal): Promise<boolean> {
  try {
    await requestJson(`/api/v1/service-orders?limit=1&offset=0`, {
      method: 'GET',
      headers: authHeaders(),
      signal,
    });
    return true;
  } catch (error) {
    if (error instanceof ServiceOrdersApiError && error.kind === 'denied') {
      return false;
    }
    return true;
  }
}

export async function probeServiceOrderPlanningCapabilities(
  signal?: AbortSignal,
): Promise<ServiceOrderPlanningCapabilities> {
  const base = `/api/v1/service-orders/${PROBE_SERVICE_ORDER_ID}`;
  const [canPlan, canUpdatePlan, canRemovePlan, canAllocate, canReallocate, canRemoveAllocation] =
    await Promise.all([
      probeMutation(`${base}/planned-resources`, 'POST', { requirementKind: 'PHYSICAL_RESOURCE', resourceTypeCode: 'TRUCK', plannedQuantity: '1' }, signal),
      probeMutation(`${base}/planned-resources/00000000-0000-4000-8000-000000000011`, 'PATCH', { rowVersion: 1 }, signal),
      probeMutation(`${base}/planned-resources/00000000-0000-4000-8000-000000000011/remove`, 'POST', { rowVersion: 1 }, signal),
      probeMutation(`${base}/allocations`, 'POST', {
        plannedResourceId: '00000000-0000-4000-8000-000000000011',
        physicalAssetId: '00000000-0000-4000-8000-000000000012',
        operationalStart: '2026-01-01T08:00:00.000Z',
        operationalEnd: '2026-01-01T10:00:00.000Z',
      }, signal),
      probeMutation(`${base}/allocations/00000000-0000-4000-8000-000000000013/reallocate`, 'POST', {
        rowVersion: 1,
        physicalAssetId: '00000000-0000-4000-8000-000000000012',
        operationalStart: '2026-01-01T08:00:00.000Z',
        operationalEnd: '2026-01-01T10:00:00.000Z',
      }, signal),
      probeMutation(`${base}/allocations/00000000-0000-4000-8000-000000000013/remove`, 'POST', { rowVersion: 1 }, signal),
    ]);

  const canRead = await probeServiceOrderListAccess(signal);

  return {
    canRead,
    canPlan,
    canUpdatePlan,
    canRemovePlan,
    canAllocate,
    canReallocate,
    canRemoveAllocation,
    canListAllocations: canRead,
  };
}
