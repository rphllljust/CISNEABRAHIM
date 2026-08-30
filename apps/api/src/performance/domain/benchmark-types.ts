import type { LatencyPercentiles } from '../../observability/metrics/latency-histogram';

export type BenchmarkSample = {
  durationMs: number;
  statusCode: number;
  ok: boolean;
};

export type BenchmarkMemorySnapshot = {
  heapUsedMb: number;
  rssMb: number;
};

export type BenchmarkDbPoolSnapshot = {
  total: number;
  idle: number;
  waiting: number;
  queryLatencyMs: LatencyPercentiles;
};

export type BenchmarkScenarioReport = {
  scenario: string;
  iterations: number;
  concurrency: number;
  durationMs: number;
  throughputRps: number;
  errorRate: number;
  latencyMs: LatencyPercentiles;
  memory: BenchmarkMemorySnapshot;
  dbPool?: BenchmarkDbPoolSnapshot;
};

export type BenchmarkRunReport = {
  profile: string;
  startedAt: string;
  endedAt: string;
  scenarios: BenchmarkScenarioReport[];
};

export type PerformanceScenarioContext = {
  accessToken: string;
  identityId: string;
  sampleClientId: string;
  sampleServiceOrderId: string;
  sampleReleasedServiceOrderId: string;
};
