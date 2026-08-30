export class RateLimitExceededError extends Error {
  readonly code = 'RATE_LIMITED';

  constructor(readonly surface: string) {
    super(`Rate limit exceeded for ${surface}.`);
    this.name = 'RateLimitExceededError';
  }
}
