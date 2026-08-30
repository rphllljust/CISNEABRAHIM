import type { BenchmarkScenarioReport } from '../domain/benchmark-types';

export type PerformanceBudget = {
  scenario: string;
  p95LatencyMs: number;
  maxErrorRate: number;
  minThroughputRps: number;
  source: 'MEASURED_BASELINE';
  measuredP95Ms: number;
  headroomFactor: number;
};

const HEADROOM_FACTOR = 2.5;
const MIN_THROUGHPUT_RPS = 1;

export function derivePerformanceBudgets(
  reports: BenchmarkScenarioReport[],
): PerformanceBudget[] {
  return reports.map((report) => {
    const measuredP95 = report.latencyMs.p95 ?? report.latencyMs.p50 ?? 1_000;
    return {
      scenario: report.scenario,
      p95LatencyMs: Math.ceil(measuredP95 * HEADROOM_FACTOR),
      maxErrorRate: 0.01,
      minThroughputRps: Math.max(
        MIN_THROUGHPUT_RPS,
        Number((report.throughputRps * 0.5).toFixed(2)),
      ),
      source: 'MEASURED_BASELINE',
      measuredP95Ms: measuredP95,
      headroomFactor: HEADROOM_FACTOR,
    };
  });
}

export function assertWithinBudget(
  report: BenchmarkScenarioReport,
  budget: PerformanceBudget,
): string[] {
  const violations: string[] = [];
  const p95 = report.latencyMs.p95 ?? Number.POSITIVE_INFINITY;
  if (p95 > budget.p95LatencyMs) {
    violations.push(`${report.scenario}: p95 ${p95}ms exceeds budget ${budget.p95LatencyMs}ms`);
  }
  if (report.errorRate > budget.maxErrorRate) {
    violations.push(
      `${report.scenario}: error rate ${report.errorRate} exceeds budget ${budget.maxErrorRate}`,
    );
  }
  if (report.throughputRps < budget.minThroughputRps) {
    violations.push(
      `${report.scenario}: throughput ${report.throughputRps} rps below budget ${budget.minThroughputRps} rps`,
    );
  }
  return violations;
}
