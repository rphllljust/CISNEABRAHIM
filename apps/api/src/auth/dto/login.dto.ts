import { AUTH_ERROR_CODES } from '../errors/auth-error-codes';
import { AuthHttpException } from '../errors/auth-http.exception';
import { normalizeLoginIdentifier } from '../crypto/token-crypto';
import { AUTH_LIMITS, parseLoginBody } from './body-validator';

export type LoginInput = {
  login: string;
  password: string;
};

export function parseLoginInput(body: unknown): LoginInput {
  const record = parseLoginBody(body);
  const login = record['login'];
  const password = record['password'];

  if (typeof login !== 'string' || login.trim().length < 3) {
    throw new AuthHttpException(400, AUTH_ERROR_CODES.VALIDATION_FAILED, 'Invalid login.');
  }

  if (login.length > AUTH_LIMITS.maxLoginLength) {
    throw new AuthHttpException(400, AUTH_ERROR_CODES.VALIDATION_FAILED, 'Invalid login.');
  }

  if (typeof password !== 'string' || password.length < 1) {
    throw new AuthHttpException(400, AUTH_ERROR_CODES.VALIDATION_FAILED, 'Invalid password.');
  }

  if (password.length > AUTH_LIMITS.maxPasswordLength) {
    throw new AuthHttpException(400, AUTH_ERROR_CODES.VALIDATION_FAILED, 'Invalid password.');
  }

  return {
    login: normalizeLoginIdentifier(login),
    password,
  };
}
