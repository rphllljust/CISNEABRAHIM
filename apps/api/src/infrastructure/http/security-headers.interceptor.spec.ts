import { describe, expect, it, afterEach } from 'vitest';
import { loadSecurityConfig } from '../../security/config/security.config';

describe('SecurityHeadersInterceptor config', () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('applies restrictive CSP defaults', () => {
    const config = loadSecurityConfig({ NODE_ENV: 'test' });
    expect(config.contentSecurityPolicy).toContain("default-src 'none'");
    expect(config.contentSecurityPolicy).toContain('frame-ancestors');
  });

  it('enables HSTS only in production unless overridden', () => {
    expect(loadSecurityConfig({ NODE_ENV: 'development' }).hstsEnabled).toBe(false);
    expect(loadSecurityConfig({ NODE_ENV: 'production' }).hstsEnabled).toBe(true);
    expect(loadSecurityConfig({ NODE_ENV: 'development', SECURITY_HSTS_ENABLED: 'true' }).hstsEnabled).toBe(
      true,
    );
  });
});
