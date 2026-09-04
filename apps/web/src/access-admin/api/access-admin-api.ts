import { getApiBaseUrl, isNetworkError } from '../../auth/api/auth-api';
import { tokenStore } from '../../auth/storage/token-store';
import type {
  AccessRole,
  CapabilityEntry,
  RoleAssignment,
  ScopeEntry,
  SodConflict,
} from '../types';

/**
 * Cliente tipado para `/api/v1/authz/access-admin`.
 *
 * Segue o mesmo padrão de `authz-api.ts`: base resolvida via `getApiBaseUrl()`,
 * token de acesso em `Authorization: Bearer`, e uma classe de erro com
 * `status` + `code` para o wrapper de rota distinguir 401 (sessão expirada)
 * de 403 (negado).
 */
export class AccessAdminApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, code?: string, message?: string) {
    super(message ?? 'access_admin_error');
    this.status = status;
    this.code = code;
  }
}

type AccessAdminErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

const BASE = '/api/v1/authz/access-admin';

export type AccessAdminCatalog = {
  capabilities: CapabilityEntry[];
  scopes: ScopeEntry[];
};

export type CreateRoleInput = {
  code: string;
  label: string;
  description?: string;
  capabilities: string[];
};

export type UpdateRoleInput = {
  label?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  capabilities?: string[];
  expectedVersion: number;
};

export type AssignRoleInput = {
  roleCode: string;
  identityId: string;
  scopeType: string;
  scopeAnchor?: string;
};

async function parseError(response: Response): Promise<AccessAdminApiError> {
  let code: string | undefined;
  try {
    const body = (await response.json()) as AccessAdminErrorBody;
    code = body.error?.code;
  } catch {
    // ignore parse errors
  }
  return new AccessAdminApiError(response.status, code);
}

function authHeaders(): HeadersInit {
  const accessToken = tokenStore.getAccessToken();
  if (!accessToken) {
    throw new AccessAdminApiError(401, 'AUTH_UNAUTHORIZED', 'session_expired');
  }
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

function jsonHeaders(): HeadersInit {
  return { ...authHeaders(), 'Content-Type': 'application/json' };
}

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, init);
    if (!response.ok) {
      throw await parseError(response);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof AccessAdminApiError) {
      throw error;
    }
    if (isNetworkError(error)) {
      throw new AccessAdminApiError(0, undefined, 'network_error');
    }
    throw new AccessAdminApiError(0, undefined, 'unknown_error');
  }
}

/**
 * Sonda o acesso ao módulo. Retorna `true` quando o catálogo pode ser lido,
 * `false` quando negado, e relança o erro em 401 para o wrapper de rota
 * expirar a sessão.
 */
export async function probeAccessAdminAccess(signal?: AbortSignal): Promise<boolean> {
  try {
    await getCatalog(signal);
    return true;
  } catch (error) {
    if (error instanceof AccessAdminApiError && error.status === 401) {
      throw error;
    }
    return false;
  }
}

export async function getCatalog(signal?: AbortSignal): Promise<AccessAdminCatalog> {
  return requestJson<AccessAdminCatalog>(`${BASE}/catalog`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function listRoles(signal?: AbortSignal): Promise<AccessRole[]> {
  return requestJson<AccessRole[]>(`${BASE}/roles`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function getRole(code: string, signal?: AbortSignal): Promise<AccessRole> {
  return requestJson<AccessRole>(`${BASE}/roles/${encodeURIComponent(code)}`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function createRole(input: CreateRoleInput): Promise<AccessRole> {
  return requestJson<AccessRole>(`${BASE}/roles`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
}

export async function updateRole(code: string, input: UpdateRoleInput): Promise<AccessRole> {
  return requestJson<AccessRole>(`${BASE}/roles/${encodeURIComponent(code)}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
}

export async function listAssignments(identityId?: string, signal?: AbortSignal): Promise<RoleAssignment[]> {
  const query = identityId ? `?identityId=${encodeURIComponent(identityId)}` : '';
  return requestJson<RoleAssignment[]>(`${BASE}/assignments${query}`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}

export async function assignRole(input: AssignRoleInput): Promise<RoleAssignment> {
  return requestJson<RoleAssignment>(`${BASE}/assignments`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
}

export async function revokeAssignment(id: string): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>(`${BASE}/assignments/${encodeURIComponent(id)}/revoke`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({}),
  });
}

export async function listSodConflicts(signal?: AbortSignal): Promise<SodConflict[]> {
  return requestJson<SodConflict[]>(`${BASE}/sod-conflicts`, {
    method: 'GET',
    headers: authHeaders(),
    signal,
  });
}
