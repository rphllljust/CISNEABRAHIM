import { AUTH_ERROR_CODES } from '../errors/auth-error-codes';
import { AuthHttpException } from '../errors/auth-http.exception';

export type RefreshInput = {
  refreshToken: string;
};

export function parseRefreshInput(body: unknown): RefreshInput {
  if (!body || typeof body !== 'object') {
    throw new AuthHttpException(400, AUTH_ERROR_CODES.VALIDATION_FAILED, 'Invalid request body.');
  }

  const record = body as Record<string, unknown>;
  const refreshToken = record['refreshToken'];

  if (typeof refreshToken !== 'string' || refreshToken.length < 20) {
    throw new AuthHttpException(400, AUTH_ERROR_CODES.VALIDATION_FAILED, 'Invalid refresh token.');
  }

  return { refreshToken };
}
