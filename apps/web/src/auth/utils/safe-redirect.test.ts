import { describe, expect, it } from 'vitest';
import { sanitizeRedirectPath } from './safe-redirect';

describe('sanitizeRedirectPath', () => {
  it('allows same-origin relative paths', () => {
    expect(sanitizeRedirectPath('/app')).toBe('/app');
    expect(sanitizeRedirectPath('/app/settings')).toBe('/app/settings');
  });

  it('blocks open redirects', () => {
    expect(sanitizeRedirectPath('https://evil.test')).toBe('/app');
    expect(sanitizeRedirectPath('//evil.test/path')).toBe('/app');
    expect(sanitizeRedirectPath('/\\evil')).toBe('/app');
  });

  it('falls back when empty', () => {
    expect(sanitizeRedirectPath(null)).toBe('/app');
    expect(sanitizeRedirectPath('')).toBe('/app');
  });
});
