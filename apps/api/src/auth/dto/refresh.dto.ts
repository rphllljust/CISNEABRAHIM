import { AUTH_ERROR_CODES } from '../errors/auth-error-codes';
import { AuthHttpException } from '../errors/auth-http.exception';
import { AUTH_LIMITS, parseRefreshBody } from './body-validator';

export type RefreshInput = {
  refreshToken: string;
};

export function parseRefreshInput(body: unknown): RefreshInput {
  const record = parseRefreshBody(body);
  const refreshToken = record['refreshToken'];

  if (typeof refreshToken !== 'string' || refreshToken.length < 20) {
    throw new AuthHttpException(400, AUTH_ERROR_CODES.VALIDATION_FAILED, 'Invalid refresh token.');
  }

  if (refreshToken.length > AUTH_LIMITS.maxRefreshTokenLength) {
    throw new AuthHttpException(400, AUTH_ERROR_CODES.VALIDATION_FAILED, 'Invalid refresh token.');
  }

  return { refreshToken };
}
