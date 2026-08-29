export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  ACCOUNT_DISABLED: 'AUTH_ACCOUNT_DISABLED',
  SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  SESSION_REVOKED: 'AUTH_SESSION_REVOKED',
  REFRESH_REUSED: 'AUTH_REFRESH_REUSED',
  UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  VALIDATION_FAILED: 'AUTH_VALIDATION_FAILED',
  RATE_LIMITED: 'AUTH_RATE_LIMITED',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

export type AuthSessionInfo = {
  id: string;
  expiresAt: string;
  status: string;
};

export type AuthTokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  session: AuthSessionInfo;
};

export type AuthSessionResponse = {
  identityId: string;
  session: AuthSessionInfo;
};

export type AuthErrorResponse = {
  error: {
    code: string;
    message: string;
    correlationId?: string;
  };
};

export type AuthSuccessResponse = {
  success: true;
};

export type AuthUserMessage =
  | 'invalid_credentials'
  | 'account_disabled'
  | 'rate_limited'
  | 'validation_failed'
  | 'session_expired'
  | 'network_error'
  | 'service_unavailable'
  | 'generic';
