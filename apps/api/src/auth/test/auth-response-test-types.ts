import type { AuthErrorCode } from '../errors/auth-error-codes';

export type AuthTokenResponseV1 = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  session: { id: string; expiresAt: string; status: 'active' };
};

export type AuthErrorResponseV1 = {
  error: {
    code: AuthErrorCode | 'HTTP_ERROR';
    message: string;
    correlationId?: string;
  };
};

export function parseAuthTokenResponse(body: string): AuthTokenResponseV1 {
  return JSON.parse(body) as AuthTokenResponseV1;
}

export function parseAuthErrorResponse(body: string): AuthErrorResponseV1 {
  return JSON.parse(body) as AuthErrorResponseV1;
}
