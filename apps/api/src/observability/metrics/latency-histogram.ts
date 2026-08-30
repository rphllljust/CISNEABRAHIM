export type LatencyPercentiles = {
  count: number;
  p50: number | null;
  p95: number | null;
  p99: number | null;
  max: number | null;
};

const MAX_SAMPLES = 2_048;

export class LatencyHistogram {
  private readonly samples: number[] = [];

  record(durationMs: number): void {
    if (!Number.isFinite(durationMs) || durationMs < 0) {
      return;
    }
    this.samples.push(durationMs);
    if (this.samples.length > MAX_SAMPLES) {
      this.samples.splice(0, this.samples.length - MAX_SAMPLES);
    }
  }

  snapshot(): LatencyPercentiles {
    if (this.samples.length === 0) {
      return { count: 0, p50: null, p95: null, p99: null, max: null };
    }
    const sorted = [...this.samples].sort((left, right) => left - right);
    return {
      count: sorted.length,
      p50: percentile(sorted, 0.5),
      p95: percentile(sorted, 0.95),
      p99: percentile(sorted, 0.99),
      max: sorted[sorted.length - 1] ?? null,
    };
  }

  reset(): void {
    this.samples.length = 0;
  }
}

function percentile(sorted: number[], ratio: number): number {
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1));
  return sorted[index] ?? 0;
}
