import { getApiBaseUrl, isNetworkError } from '../auth/api/auth-api';
import { tokenStore } from '../auth/storage/token-store';
import type { ModuleRegistryDetail, ModuleRegistrySummary } from './types';

export type RegistryApiErrorKind = 'unauthenticated' | 'denied' | 'not_found' | 'network' | 'unknown';

export class RegistryApiError extends Error {
  readonly kind: RegistryApiErrorKind;

  constructor(kind: RegistryApiErrorKind) {
    super(kind);
    this.kind = kind;
  }
}

function authHeaders(): HeadersInit {
  const accessToken = tokenStore.getAccessToken();
  if (!accessToken) {
    throw new RegistryApiError('unauthenticated');
  }
  return { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' };
}

function errorKind(status: number, network: boolean): RegistryApiErrorKind {
  if (network || isNetworkError(status)) return 'network';
  if (status === 401) return 'unauthenticated';
  if (status === 403) return 'denied';
  if (status === 404) return 'not_found';
  return 'unknown';
}

async function parse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export async function fetchModulesRegistry(): Promise<ModuleRegistrySummary[]> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/api/v1/modules/registry`, { headers: authHeaders() });
  } catch {
    throw new RegistryApiError('network');
  }
  if (!response.ok) {
    throw new RegistryApiError(errorKind(response.status, false));
  }
  return parse<ModuleRegistrySummary[]>(response);
}

export async function fetchModuleRegistryDetail(moduleCode: string): Promise<ModuleRegistryDetail> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/api/v1/modules/registry/${encodeURIComponent(moduleCode)}`, {
      headers: authHeaders(),
    });
  } catch {
    throw new RegistryApiError('network');
  }
  if (!response.ok) {
    throw new RegistryApiError(errorKind(response.status, false));
  }
  return parse<ModuleRegistryDetail>(response);
}