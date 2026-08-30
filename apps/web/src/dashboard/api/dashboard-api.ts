import { getApiBaseUrl, isNetworkError } from '../../auth/api/auth-api';
import { tokenStore } from '../../auth/storage/token-store';
import {
  DASHBOARD_ERROR_CODES,
  DashboardApiError,
  type DashboardErrorCode,
  type OperationalDashboardSnapshot,
} from '../types/dashboard.types';

function authHeaders(): HeadersInit {
  const accessToken = tokenStore.getAccessToken();
  if (!accessToken) {
    throw new DashboardApiError(401, undefined, 'denied');
  }
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  };
}

function classifyError(status: number, code?: DashboardErrorCode): DashboardApiError['kind'] {
  if (code === DASHBOARD_ERROR_CODES.ACCESS_DENIED || status === 403) {
    return 'denied';
  }
  return 'unknown';
}

async function parseError(response: Response): Promise<DashboardApiError> {
  let code: DashboardErrorCode | undefined;
  try {
    const body = (await response.json()) as { code?: DashboardErrorCode };
    code = body.code;
  } catch {
    // ignore
  }
  return new DashboardApiError(response.status, code, classifyError(response.status, code));
}

export async function getOperationalDashboard(
  signal?: AbortSignal,
): Promise<OperationalDashboardSnapshot> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/dashboard/operational`, {
      method: 'GET',
      headers: authHeaders(),
      signal,
    });
    if (!response.ok) {
      throw await parseError(response);
    }
    return (await response.json()) as OperationalDashboardSnapshot;
  } catch (error) {
    if (error instanceof DashboardApiError) {
      throw error;
    }
    if (isNetworkError(error)) {
      throw new DashboardApiError(0, undefined, 'network');
    }
    throw error;
  }
}

export async function probeOperationalDashboardAccess(signal?: AbortSignal): Promise<boolean> {
  try {
    await getOperationalDashboard(signal);
    return true;
  } catch (error) {
    if (error instanceof DashboardApiError && error.kind === 'denied') {
      return false;
    }
    throw error;
  }
}
