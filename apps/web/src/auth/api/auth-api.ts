import {
  AUTH_ERROR_CODES,
  type AuthErrorResponse,
  type AuthSessionResponse,
  type AuthSuccessResponse,
  type AuthTokenResponse,
  type AuthUserMessage,
} from '../types/auth.types';

export function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (!base) {
    return 'http://localhost:3000';
  }
  return base.replace(/\/$/, '');
}

export function mapAuthErrorToUserMessage(code: string | undefined): AuthUserMessage {
  switch (code) {
    case AUTH_ERROR_CODES.INVALID_CREDENTIALS:
      return 'invalid_credentials';
    case AUTH_ERROR_CODES.ACCOUNT_DISABLED:
      return 'account_disabled';
    case AUTH_ERROR_CODES.RATE_LIMITED:
      return 'rate_limited';
    case AUTH_ERROR_CODES.VALIDATION_FAILED:
      return 'validation_failed';
    case AUTH_ERROR_CODES.SESSION_EXPIRED:
    case AUTH_ERROR_CODES.SESSION_REVOKED:
    case AUTH_ERROR_CODES.REFRESH_REUSED:
    case AUTH_ERROR_CODES.UNAUTHORIZED:
      return 'session_expired';
    default:
      return 'generic';
  }
}

export function userMessageText(message: AuthUserMessage): string {
  switch (message) {
    case 'invalid_credentials':
      return 'Invalid login or password.';
    case 'account_disabled':
      return 'This account is not available.';
    case 'rate_limited':
      return 'Too many attempts. Try again later.';
    case 'validation_failed':
      return 'Check the entered data and try again.';
    case 'session_expired':
      return 'Your session has expired. Sign in again.';
    case 'network_error':
      return 'Unable to reach the server. Check your connection.';
    case 'service_unavailable':
      return 'The service is temporarily unavailable.';
    default:
      return 'Something went wrong. Try again.';
  }
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }
  if (error instanceof DOMException && error.name === 'AbortError') {
    return false;
  }
  return false;
}

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export class AuthApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly userMessage: AuthUserMessage;

  constructor(status: number, code: string | undefined, userMessage: AuthUserMessage) {
    super(userMessage);
    this.status = status;
    this.code = code;
    this.userMessage = userMessage;
  }
}

export async function loginRequest(
  login: string,
  password: string,
  signal?: AbortSignal,
): Promise<AuthTokenResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ login, password }),
    signal,
  });

  if (!response.ok) {
    const body = await parseJson<AuthErrorResponse>(response);
    throw new AuthApiError(
      response.status,
      body?.error.code,
      mapAuthErrorToUserMessage(body?.error.code),
    );
  }

  return (await response.json()) as AuthTokenResponse;
}

export async function refreshRequest(
  refreshToken: string,
  signal?: AbortSignal,
): Promise<AuthTokenResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refreshToken }),
    signal,
  });

  if (!response.ok) {
    const body = await parseJson<AuthErrorResponse>(response);
    throw new AuthApiError(
      response.status,
      body?.error.code,
      mapAuthErrorToUserMessage(body?.error.code),
    );
  }

  return (await response.json()) as AuthTokenResponse;
}

export async function sessionRequest(
  accessToken: string,
  signal?: AbortSignal,
): Promise<AuthSessionResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/session`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  if (!response.ok) {
    const body = await parseJson<AuthErrorResponse>(response);
    throw new AuthApiError(
      response.status,
      body?.error.code,
      mapAuthErrorToUserMessage(body?.error.code),
    );
  }

  return (await response.json()) as AuthSessionResponse;
}

export async function logoutRequest(
  accessToken: string,
  signal?: AbortSignal,
): Promise<AuthSuccessResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/logout`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  if (!response.ok) {
    const body = await parseJson<AuthErrorResponse>(response);
    throw new AuthApiError(
      response.status,
      body?.error.code,
      mapAuthErrorToUserMessage(body?.error.code),
    );
  }

  return (await response.json()) as AuthSuccessResponse;
}

export async function logoutAllRequest(
  accessToken: string,
  signal?: AbortSignal,
): Promise<AuthSuccessResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/logout-all`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  if (!response.ok) {
    const body = await parseJson<AuthErrorResponse>(response);
    throw new AuthApiError(
      response.status,
      body?.error.code,
      mapAuthErrorToUserMessage(body?.error.code),
    );
  }

  return (await response.json()) as AuthSuccessResponse;
}
