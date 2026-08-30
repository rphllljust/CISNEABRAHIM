import { describe, expect, it } from 'vitest';
import { computeBackoffDelayMs } from './worker.config';

describe('computeBackoffDelayMs', () => {
  it('applies exponential backoff with cap', () => {
    expect(computeBackoffDelayMs(1, 1_000, 10_000)).toBe(1_000);
    expect(computeBackoffDelayMs(2, 1_000, 10_000)).toBe(2_000);
    expect(computeBackoffDelayMs(3, 1_000, 10_000)).toBe(4_000);
    expect(computeBackoffDelayMs(10, 1_000, 5_000)).toBe(5_000);
  });
});
