import { getApiBaseUrl, isNetworkError } from '../auth/api/auth-api';
import { tokenStore } from '../auth/storage/token-store';
import type { ModuleRegistryEntry } from './types';

/**
 * Server-side enterprise module registry client. The registry is authoritative:
 * the server decides which modules exist, their status (feature flags) and
 * which capabilities/resources are projected from the authorization catalog.
 * This client only reflects it — it never invents a module.
 */
export async function fetchModulesRegistry(): Promise<ModuleRegistryEntry[]> {
  const accessToken = tokenStore.getAccessToken();
  if (!accessToken) {
    throw new Error('UNAUTHENTICATED');
  }
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}/api/v1/modules/registry`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    });
  } catch {
    throw new Error('NETWORK');
  }
  if (response.status === 401) {
    throw new Error('UNAUTHENTICATED');
  }
  if (response.status === 403) {
    throw new Error('DENIED');
  }
  if (!response.ok) {
    throw new Error(isNetworkError(response.status) ? 'NETWORK' : 'UNKNOWN');
  }
  const body = (await response.json()) as ModuleRegistryEntry[];
  return body;
}
