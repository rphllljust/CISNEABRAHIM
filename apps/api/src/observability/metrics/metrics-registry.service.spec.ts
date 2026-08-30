import { describe, expect, it } from 'vitest';
import { MetricsRegistryService } from './metrics-registry.service';

describe('MetricsRegistryService', () => {
  it('tracks http error rate and latency', () => {
    const registry = new MetricsRegistryService();
    registry.recordHttpRequest(20, false);
    registry.recordHttpRequest(120, true);

    const snapshot = registry.getHttpSnapshot();
    expect(snapshot.total).toBe(2);
    expect(snapshot.errors).toBe(1);
    expect(snapshot.latencyMs.count).toBe(2);
    expect(snapshot.latencyMs.p95).toBeGreaterThanOrEqual(20);
  });

  it('tracks worker metrics snapshot', () => {
    const registry = new MetricsRegistryService();
    registry.setWorkerMetrics({
      processed: 10,
      succeeded: 8,
      retried: 1,
      failedPermanent: 1,
      deadLettered: 0,
      inFlight: 2,
    });

    expect(registry.getWorkerSnapshot()).toEqual({
      processed: 10,
      succeeded: 8,
      retried: 1,
      failedPermanent: 1,
      deadLettered: 0,
      inFlight: 2,
    });
  });

  it('tracks storage failures', () => {
    const registry = new MetricsRegistryService();
    registry.recordStorageFailure();
    expect(registry.getFailureCounters().storageFailures).toBe(1);
  });
});
