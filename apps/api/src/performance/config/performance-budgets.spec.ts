import { describe, expect, it } from 'vitest';
import { derivePerformanceBudgets, assertWithinBudget } from '../config/performance-budgets';
import type { BenchmarkScenarioReport } from '../domain/benchmark-types';

describe('performance-budgets', () => {
  it('derives budgets from measured baselines with headroom', () => {
    const reports: BenchmarkScenarioReport[] = [
      {
        scenario: 'clients.list',
        iterations: 10,
        concurrency: 2,
        durationMs: 100,
        throughputRps: 100,
        errorRate: 0,
        latencyMs: { count: 10, p50: 40, p95: 80, p99: 90, max: 95 },
        memory: { heapUsedMb: 50, rssMb: 100 },
      },
    ];

    const budgets = derivePerformanceBudgets(reports);
    expect(budgets[0]?.p95LatencyMs).toBe(200);
    expect(budgets[0]?.measuredP95Ms).toBe(80);
    expect(assertWithinBudget(reports[0]!, budgets[0]!)).toEqual([]);
  });

  it('flags regressions beyond budget', () => {
    const report: BenchmarkScenarioReport = {
      scenario: 'search.advanced',
      iterations: 10,
      concurrency: 2,
      durationMs: 100,
      throughputRps: 0.5,
      errorRate: 0.2,
      latencyMs: { count: 10, p50: 200, p95: 500, p99: 600, max: 700 },
      memory: { heapUsedMb: 50, rssMb: 100 },
    };
    const budget = {
      scenario: 'search.advanced',
      p95LatencyMs: 400,
      maxErrorRate: 0.01,
      minThroughputRps: 1,
      source: 'MEASURED_BASELINE' as const,
      measuredP95Ms: 160,
      headroomFactor: 2.5,
    };
    const violations = assertWithinBudget(report, budget);
    expect(violations.length).toBeGreaterThan(0);
  });
});
