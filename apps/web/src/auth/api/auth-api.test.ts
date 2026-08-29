import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUTH_ERROR_CODES } from '../types/auth.types';
import { loginRequest, mapAuthErrorToUserMessage, userMessageText } from './auth-api';

describe('auth-api', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps invalid credentials to a single safe message', () => {
    expect(mapAuthErrorToUserMessage(AUTH_ERROR_CODES.INVALID_CREDENTIALS)).toBe(
      'invalid_credentials',
    );
    expect(userMessageText('invalid_credentials')).toBe('Invalid login or password.');
  });

  it('loginRequest surfaces backend auth errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          error: { code: AUTH_ERROR_CODES.INVALID_CREDENTIALS, message: 'Invalid credentials.' },
        }),
      }),
    );

    await expect(loginRequest('user', 'wrong')).rejects.toMatchObject({
      userMessage: 'invalid_credentials',
    });
  });
});
