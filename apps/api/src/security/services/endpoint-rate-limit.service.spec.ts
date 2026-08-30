import { afterEach, describe, expect, it } from 'vitest';
import { EndpointRateLimitService } from './endpoint-rate-limit.service';
import { RateLimitExceededError } from '../errors/rate-limit-exceeded.error';

describe('EndpointRateLimitService', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('blocks after max requests in window', () => {
    process.env['SECURITY_RATE_LOGIN_MAX'] = '2';
    process.env['SECURITY_RATE_LOGIN_WINDOW_MS'] = '60000';
    const limiter = new EndpointRateLimitService();
    limiter.assertAllowed('login', 'client-1');
    limiter.assertAllowed('login', 'client-1');
    expect(() => limiter.assertAllowed('login', 'client-1')).toThrow(RateLimitExceededError);
  });

  it('isolates buckets per surface and key', () => {
    process.env['SECURITY_RATE_SEARCH_MAX'] = '1';
    const limiter = new EndpointRateLimitService();
    limiter.assertAllowed('search', 'user-a');
    expect(() => limiter.assertAllowed('search', 'user-a')).toThrow(RateLimitExceededError);
    expect(() => limiter.assertAllowed('search', 'user-b')).not.toThrow();
    expect(() => limiter.assertAllowed('upload', 'user-a')).not.toThrow();
  });
});
