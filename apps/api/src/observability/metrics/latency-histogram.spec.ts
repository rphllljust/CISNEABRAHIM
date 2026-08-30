import { describe, expect, it } from 'vitest';
import { LatencyHistogram } from './latency-histogram';

describe('LatencyHistogram', () => {
  it('computes p50/p95/p99 percentiles', () => {
    const histogram = new LatencyHistogram();
    for (let value = 1; value <= 100; value += 1) {
      histogram.record(value);
    }

    const snapshot = histogram.snapshot();
    expect(snapshot.count).toBe(100);
    expect(snapshot.p50).toBeGreaterThanOrEqual(45);
    expect(snapshot.p95).toBeGreaterThanOrEqual(90);
    expect(snapshot.p99).toBeGreaterThanOrEqual(95);
    expect(snapshot.max).toBe(100);
  });
});
