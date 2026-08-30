import { describe, expect, it } from 'vitest';
import { CircuitBreaker } from './circuit-breaker';

describe('CircuitBreaker', () => {
  it('opens after consecutive failures and blocks calls until reset', () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 50 });

    breaker.recordFailure();
    expect(breaker.getState()).toBe('CLOSED');
    breaker.recordFailure();
    expect(breaker.getState()).toBe('OPEN');
    expect(() => breaker.assertCallAllowed()).toThrow('CIRCUIT_BREAKER_OPEN');

    const openedAt = Date.now();
    while (Date.now() - openedAt < 60) {
      // busy wait for reset window
    }
    expect(breaker.getState()).toBe('HALF_OPEN');
    breaker.recordSuccess();
    expect(breaker.getState()).toBe('CLOSED');
  });
});
