import { describe, expect, it } from 'vitest';
import { AUTH_ERROR_CODES } from '../errors/auth-error-codes';
import { AuthHttpException } from '../errors/auth-http.exception';
import { parseLoginInput } from './login.dto';
import { parseRefreshInput } from './refresh.dto';

describe('parseLoginInput', () => {
  it('accepts valid login payload', () => {
    const parsed = parseLoginInput({ login: 'user@example.com', password: 'secret' });
    expect(parsed.login).toBe('user@example.com');
    expect(parsed.password).toBe('secret');
  });

  it('normalizes login identifier', () => {
    const parsed = parseLoginInput({ login: '  User@Example.COM ', password: 'secret' });
    expect(parsed.login).toBe('user@example.com');
  });

  it('rejects invalid payloads', () => {
    expect(() => parseLoginInput(null)).toThrow(AuthHttpException);
    expect(() => parseLoginInput({ login: 'ab', password: 'x' })).toThrow(AuthHttpException);
    expect(() => parseLoginInput({ login: 'valid@login.com', password: '' })).toThrow(
      AuthHttpException,
    );
  });

  it('returns stable validation error code', () => {
    try {
      parseLoginInput({});
    } catch (error) {
      expect(error).toBeInstanceOf(AuthHttpException);
      const body = (error as AuthHttpException).getResponse() as {
        error: { code: string };
      };
      expect(body.error.code).toBe(AUTH_ERROR_CODES.VALIDATION_FAILED);
    }
  });
});

describe('parseRefreshInput', () => {
  it('accepts valid refresh payload', () => {
    const token = 'a'.repeat(32);
    const parsed = parseRefreshInput({ refreshToken: token });
    expect(parsed.refreshToken).toBe(token);
  });

  it('rejects short or missing refresh token', () => {
    expect(() => parseRefreshInput({ refreshToken: 'short' })).toThrow(AuthHttpException);
    expect(() => parseRefreshInput({})).toThrow(AuthHttpException);
  });

  it('rejects unknown fields and oversized payloads', () => {
    expect(() =>
      parseLoginInput({ login: 'user@example.com', password: 'secret', redirect: 'http://evil' }),
    ).toThrow(AuthHttpException);
    expect(() => parseLoginInput({ login: 'a'.repeat(400), password: 'secret' })).toThrow(
      AuthHttpException,
    );
    expect(() => parseRefreshInput({ refreshToken: 'a'.repeat(600) })).toThrow(AuthHttpException);
  });
});
