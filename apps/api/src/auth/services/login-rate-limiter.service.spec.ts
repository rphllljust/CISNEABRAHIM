import { describe, expect, it } from 'vitest';
import { LoginRateLimiterService } from './login-rate-limiter.service';
import type { AuthConfig } from '../config/auth.config';

const config: AuthConfig = {
  jwtSecret: 'rate-limit-test-secret-32-chars-min!',
  jwtIssuer: 'cisne-api-test',
  jwtAudience: 'cisne-clients-test',
  accessTokenTtlSeconds: 60,
  refreshTokenTtlSeconds: 3600,
  corsOrigin: 'http://localhost:5173',
  loginRateLimitPerMinute: 3,
};

describe('LoginRateLimiterService', () => {
  it('allows requests within the limit', () => {
    const limiter = new LoginRateLimiterService(config);
    expect(() => limiter.assertAllowed('client-a')).not.toThrow();
    expect(() => limiter.assertAllowed('client-a')).not.toThrow();
    expect(() => limiter.assertAllowed('client-a')).not.toThrow();
  });

  it('blocks repeated abuse for the same client key', () => {
    const limiter = new LoginRateLimiterService(config);
    limiter.assertAllowed('client-b');
    limiter.assertAllowed('client-b');
    limiter.assertAllowed('client-b');
    expect(() => limiter.assertAllowed('client-b')).toThrow('rate limited');
  });

  it('isolates buckets per client key', () => {
    const limiter = new LoginRateLimiterService(config);
    limiter.assertAllowed('client-c');
    limiter.assertAllowed('client-c');
    limiter.assertAllowed('client-c');
    expect(() => limiter.assertAllowed('client-d')).not.toThrow();
  });
});
