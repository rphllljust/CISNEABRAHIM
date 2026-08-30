import { afterEach, describe, expect, it } from 'vitest';
import { LoginRateLimiterService } from './login-rate-limiter.service';
import { EndpointRateLimitService } from '../../security/services/endpoint-rate-limit.service';
import { RateLimitExceededError } from '../../security/errors/rate-limit-exceeded.error';

describe('LoginRateLimiterService', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('allows requests within the limit', () => {
    process.env['SECURITY_RATE_LOGIN_MAX'] = '3';
    const limiter = new LoginRateLimiterService(new EndpointRateLimitService());
    expect(() => limiter.assertAllowed('client-a')).not.toThrow();
    expect(() => limiter.assertAllowed('client-a')).not.toThrow();
    expect(() => limiter.assertAllowed('client-a')).not.toThrow();
  });

  it('blocks repeated abuse for the same client key', () => {
    process.env['SECURITY_RATE_LOGIN_MAX'] = '3';
    const limiter = new LoginRateLimiterService(new EndpointRateLimitService());
    limiter.assertAllowed('client-b');
    limiter.assertAllowed('client-b');
    limiter.assertAllowed('client-b');
    expect(() => limiter.assertAllowed('client-b')).toThrow(RateLimitExceededError);
  });

  it('isolates buckets per client key', () => {
    process.env['SECURITY_RATE_LOGIN_MAX'] = '3';
    const limiter = new LoginRateLimiterService(new EndpointRateLimitService());
    limiter.assertAllowed('client-c');
    limiter.assertAllowed('client-c');
    limiter.assertAllowed('client-c');
    expect(() => limiter.assertAllowed('client-d')).not.toThrow();
  });
});
