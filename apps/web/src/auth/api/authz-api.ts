import { getApiBaseUrl } from './auth-api';
import { tokenStore } from '../storage/token-store';

export type AuthzProbeResponse = {
  status: string;
  identityId: string;
  sessionId: string;
};

export class AuthzApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, code?: string, message = 'authorization_failed') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function probeRequest(signal?: AbortSignal): Promise<AuthzProbeResponse> {
  const accessToken = tokenStore.getAccessToken();
  if (!accessToken) {
    throw new AuthzApiError(401, 'AUTH_UNAUTHORIZED', 'session_expired');
  }

  const response = await fetch(`${getApiBaseUrl()}/api/v1/authz/probe`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  if (!response.ok) {
    let code: string | undefined;
    try {
      const body = (await response.json()) as { error?: { code?: string } };
      code = body.error?.code;
    } catch {
      // ignore parse errors
    }
    throw new AuthzApiError(response.status, code);
  }

  return (await response.json()) as AuthzProbeResponse;
}
