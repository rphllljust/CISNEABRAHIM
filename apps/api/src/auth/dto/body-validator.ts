import { AUTH_ERROR_CODES } from '../errors/auth-error-codes';
import { AuthHttpException } from '../errors/auth-http.exception';

const ALLOWED_LOGIN_KEYS = new Set(['login', 'password']);
const ALLOWED_REFRESH_KEYS = new Set(['refreshToken']);

export const AUTH_LIMITS = {
  maxLoginLength: 320,
  maxPasswordLength: 256,
  maxRefreshTokenLength: 512,
  maxJwtLength: 8_192,
  maxJsonKeys: 10,
} as const;

export function assertStrictObject(
  body: unknown,
  allowedKeys: ReadonlySet<string>,
): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AuthHttpException(400, AUTH_ERROR_CODES.VALIDATION_FAILED, 'Invalid request body.');
  }

  const record = body as Record<string, unknown>;
  const keys = Object.keys(record);

  if (keys.length > AUTH_LIMITS.maxJsonKeys) {
    throw new AuthHttpException(400, AUTH_ERROR_CODES.VALIDATION_FAILED, 'Invalid request body.');
  }

  for (const key of keys) {
    if (!allowedKeys.has(key)) {
      throw new AuthHttpException(400, AUTH_ERROR_CODES.VALIDATION_FAILED, 'Invalid request body.');
    }
  }

  return record;
}

export function parseLoginBody(body: unknown): Record<string, unknown> {
  return assertStrictObject(body, ALLOWED_LOGIN_KEYS);
}

export function parseRefreshBody(body: unknown): Record<string, unknown> {
  return assertStrictObject(body, ALLOWED_REFRESH_KEYS);
}
