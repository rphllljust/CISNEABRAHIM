import { describe, expect, it } from 'vitest';
import {
  containsSensitiveErrorLeak,
  sanitizeHttpExceptionMessage,
  sanitizePublicErrorMessage,
} from './safe-error-message';

describe('safe-error-message', () => {
  it('detects SQL, paths and stack traces', () => {
    expect(containsSensitiveErrorLeak('SELECT * FROM users WHERE id = 1')).toBe(true);
    expect(containsSensitiveErrorLeak('ENOENT: /var/lib/data/file')).toBe(true);
    expect(containsSensitiveErrorLeak('at Object.<anonymous> (src/main.ts:10:5)')).toBe(true);
    expect(containsSensitiveErrorLeak('postgresql://user:pass@host/db')).toBe(true);
  });

  it('sanitizes production internal errors', () => {
    const result = sanitizePublicErrorMessage(new Error('secret internal detail'), {
      isProduction: true,
    });
    expect(result.message).toBe('An internal error occurred.');
    expect(result.message).not.toContain('secret');
  });

  it('allows safe dev messages', () => {
    const result = sanitizePublicErrorMessage(new Error('validation failed'), {
      isProduction: false,
    });
    expect(result.message).toBe('validation failed');
  });

  it('masks leaky 4xx messages', () => {
    expect(sanitizeHttpExceptionMessage('password=abc', 400)).toBe('Request failed.');
    expect(sanitizeHttpExceptionMessage('Invalid input', 400)).toBe('Invalid input');
    expect(sanitizeHttpExceptionMessage('db exploded', 500)).toBe('Internal server error.');
  });
});
