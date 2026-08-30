import { Injectable } from '@nestjs/common';
import { loadSecurityConfig, type SecurityConfig, type RateLimitSurface } from '../config/security.config';
import { RateLimitExceededError } from '../errors/rate-limit-exceeded.error';

type Bucket = {
  count: number;
  resetAtMs: number;
};

@Injectable()
export class EndpointRateLimitService {
  private readonly buckets = new Map<string, Bucket>();
  private readonly config: SecurityConfig;

  constructor() {
    this.config = loadSecurityConfig();
  }

  assertAllowed(surface: RateLimitSurface, key: string): void {
    const policy = this.config.rateLimits[surface];
    const bucketKey = `${surface}:${key}`;
    const now = Date.now();
    const existing = this.buckets.get(bucketKey);

    if (!existing || existing.resetAtMs <= now) {
      this.buckets.set(bucketKey, { count: 1, resetAtMs: now + policy.windowMs });
      return;
    }

    if (existing.count >= policy.maxRequests) {
      throw new RateLimitExceededError(surface);
    }

    existing.count += 1;
    this.buckets.set(bucketKey, existing);
  }

  reset(surface: RateLimitSurface, key: string): void {
    this.buckets.delete(`${surface}:${key}`);
  }
}
