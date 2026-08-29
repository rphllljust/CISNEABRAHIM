import { Inject, Injectable } from '@nestjs/common';
import { AUTH_CONFIG } from '../auth.constants';
import type { AuthConfig } from '../config/auth.config';

type Bucket = {
  count: number;
  resetAtMs: number;
};

@Injectable()
export class LoginRateLimiterService {
  private readonly buckets = new Map<string, Bucket>();

  constructor(@Inject(AUTH_CONFIG) private readonly config: AuthConfig) {}

  assertAllowed(clientKey: string): void {
    const now = Date.now();
    const windowMs = 60_000;
    const existing = this.buckets.get(clientKey);

    if (!existing || existing.resetAtMs <= now) {
      this.buckets.set(clientKey, { count: 1, resetAtMs: now + windowMs });
      return;
    }

    if (existing.count >= this.config.loginRateLimitPerMinute) {
      throw new Error('rate limited');
    }

    existing.count += 1;
    this.buckets.set(clientKey, existing);
  }
}
