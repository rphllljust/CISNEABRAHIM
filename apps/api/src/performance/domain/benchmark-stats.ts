import { LatencyHistogram } from '../../observability/metrics/latency-histogram';
import type { BenchmarkSample } from './benchmark-types';

export function summarizeBenchmarkSamples(
  samples: BenchmarkSample[],
  durationMs: number,
): {
  throughputRps: number;
  errorRate: number;
  latencyMs: ReturnType<LatencyHistogram['snapshot']>;
} {
  const histogram = new LatencyHistogram();
  let errors = 0;
  for (const sample of samples) {
    histogram.record(sample.durationMs);
    if (!sample.ok) {
      errors += 1;
    }
  }
  const seconds = Math.max(durationMs / 1_000, 0.001);
  return {
    throughputRps: samples.length / seconds,
    errorRate: samples.length === 0 ? 0 : errors / samples.length,
    latencyMs: histogram.snapshot(),
  };
}

export function memorySnapshotMb(): { heapUsedMb: number; rssMb: number } {
  const memory = process.memoryUsage();
  return {
    heapUsedMb: Number((memory.heapUsed / 1_024 / 1_024).toFixed(2)),
    rssMb: Number((memory.rss / 1_024 / 1_024).toFixed(2)),
  };
}
