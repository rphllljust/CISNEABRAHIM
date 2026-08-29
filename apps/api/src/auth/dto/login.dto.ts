import { AUTH_ERROR_CODES } from '../errors/auth-error-codes';
import { AuthHttpException } from '../errors/auth-http.exception';
import { normalizeLoginIdentifier } from '../crypto/token-crypto';

export type LoginInput = {
  login: string;
  password: string;
};

export function parseLoginInput(body: unknown): LoginInput {
  if (!body || typeof body !== 'object') {
    throw new AuthHttpException(400, AUTH_ERROR_CODES.VALIDATION_FAILED, 'Invalid request body.');
  }

  const record = body as Record<string, unknown>;
  const login = record['login'];
  const password = record['password'];

  if (typeof login !== 'string' || login.trim().length < 3) {
    throw new AuthHttpException(400, AUTH_ERROR_CODES.VALIDATION_FAILED, 'Invalid login.');
  }

  if (typeof password !== 'string' || password.length < 1) {
    throw new AuthHttpException(400, AUTH_ERROR_CODES.VALIDATION_FAILED, 'Invalid password.');
  }

  return {
    login: normalizeLoginIdentifier(login),
    password,
  };
}
