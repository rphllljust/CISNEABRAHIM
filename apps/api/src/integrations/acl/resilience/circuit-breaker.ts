export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export type CircuitBreakerOptions = {
  failureThreshold: number;
  resetTimeoutMs: number;
};

export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private consecutiveFailures = 0;
  private openedAt: number | null = null;

  constructor(private readonly options: CircuitBreakerOptions) {}

  getState(): CircuitBreakerState {
    if (this.state === 'OPEN' && this.openedAt !== null) {
      if (Date.now() - this.openedAt >= this.options.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
      }
    }
    return this.state;
  }

  assertCallAllowed(): void {
    if (this.getState() === 'OPEN') {
      throw new Error('CIRCUIT_BREAKER_OPEN');
    }
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.openedAt = null;
    this.state = 'CLOSED';
  }

  recordFailure(): void {
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= this.options.failureThreshold) {
      this.state = 'OPEN';
      this.openedAt = Date.now();
    }
  }
}
