import type { Pool } from 'pg';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { BenchmarkRunner, type BenchmarkScenario } from '../performance/benchmark/benchmark-runner';
import type { BenchmarkRunReport, BenchmarkScenarioReport } from '../performance/domain/benchmark-types';
import { memorySnapshotMb } from '../performance/domain/benchmark-stats';
import type { PerformanceScenarioContext } from '../performance/domain/benchmark-types';
import { collectPlatformSnapshot, type PlatformSnapshot } from './platform-snapshot';

export type StressPhaseResult = {
  phase: string;
  report: BenchmarkRunReport;
  platform: PlatformSnapshot;
  memory: ReturnType<typeof memorySnapshotMb>;
  firstBottleneck?: string;
};

export type SoakObservation = {
  samples: number;
  maxHeapMb: number;
  maxRssMb: number;
  maxDbConnections: number;
  maxOutboxPending: number;
};

const STRESS_ERROR_RATE_CEILING = 0.05;
const STRESS_P99_CEILING_MS = 5_000;
const SPIKE_CONCURRENCY = 24;
const LEAK_HEAP_GROWTH_MB = 32;
const LEAK_CONNECTION_DELTA = 4;

export async function runBenchmarkPhase(
  app: NestFastifyApplication,
  pool: Pool,
  profile: string,
  scenarios: BenchmarkScenario[],
  context: PerformanceScenarioContext,
): Promise<StressPhaseResult> {
  const runner = new BenchmarkRunner(app, { profile, pool, collectDbPool: true });
  const report = await runner.run(scenarios, context);
  const platform = await collectPlatformSnapshot(pool);
  return {
    phase: profile,
    report,
    platform,
    memory: memorySnapshotMb(),
  };
}

export async function runStressRamp(
  app: NestFastifyApplication,
  pool: Pool,
  baseScenarios: BenchmarkScenario[],
  context: PerformanceScenarioContext,
): Promise<StressPhaseResult> {
  const levels = [2, 4, 8, 12, 16];
  let lastReport: BenchmarkRunReport | undefined;
  let firstBottleneck: string | undefined;

  for (const concurrency of levels) {
    const scenarios = baseScenarios.map((scenario) => ({
      ...scenario,
      concurrency,
      iterations: Math.max(concurrency * 3, 6),
    }));
    const runner = new BenchmarkRunner(app, { profile: `stress-c${concurrency}`, pool, collectDbPool: true });
    lastReport = await runner.run(scenarios, context);

    const hottest = [...lastReport.scenarios].sort(
      (left, right) => (right.latencyMs.p99 ?? 0) - (left.latencyMs.p99 ?? 0),
    )[0];
    if (
      hottest &&
      (hottest.errorRate > STRESS_ERROR_RATE_CEILING ||
        (hottest.latencyMs.p99 ?? 0) > STRESS_P99_CEILING_MS)
    ) {
      firstBottleneck = hottest.scenario;
      break;
    }
    firstBottleneck = hottest?.scenario;
  }

  if (!lastReport) {
    throw new Error('Stress ramp produced no report.');
  }

  return {
    phase: 'stress',
    report: lastReport,
    platform: await collectPlatformSnapshot(pool),
    memory: memorySnapshotMb(),
    firstBottleneck,
  };
}

export async function runSpikePhase(
  app: NestFastifyApplication,
  pool: Pool,
  baseScenarios: BenchmarkScenario[],
  context: PerformanceScenarioContext,
): Promise<StressPhaseResult> {
  const scenarios = baseScenarios.slice(0, 4).map((scenario) => ({
    ...scenario,
    concurrency: SPIKE_CONCURRENCY,
    iterations: SPIKE_CONCURRENCY * 2,
  }));
  const runner = new BenchmarkRunner(app, { profile: 'spike', pool, collectDbPool: true });
  const report = await runner.run(scenarios, context);
  return {
    phase: 'spike',
    report,
    platform: await collectPlatformSnapshot(pool),
    memory: memorySnapshotMb(),
  };
}

export async function runSoakPhase(
  app: NestFastifyApplication,
  pool: Pool,
  baseScenarios: BenchmarkScenario[],
  context: PerformanceScenarioContext,
  durationSeconds: number,
): Promise<{ result: StressPhaseResult; observation: SoakObservation }> {
  const runner = new BenchmarkRunner(app, { profile: 'soak', pool, collectDbPool: true });
  const deadline = Date.now() + durationSeconds * 1_000;
  const reports: BenchmarkScenarioReport[] = [];
  const observation: SoakObservation = {
    samples: 0,
    maxHeapMb: 0,
    maxRssMb: 0,
    maxDbConnections: 0,
    maxOutboxPending: 0,
  };

  let cycle = 0;
  while (Date.now() < deadline) {
    const scenario = baseScenarios[cycle % baseScenarios.length]!;
    const report = await runner.run(
      [{ ...scenario, concurrency: 3, iterations: 9 }],
      context,
    );
    reports.push(...report.scenarios);
    observation.samples += 1;

    const memory = memorySnapshotMb();
    observation.maxHeapMb = Math.max(observation.maxHeapMb, memory.heapUsedMb);
    observation.maxRssMb = Math.max(observation.maxRssMb, memory.rssMb);

    const platform = await collectPlatformSnapshot(pool);
    observation.maxDbConnections = Math.max(observation.maxDbConnections, platform.dbConnections);
    observation.maxOutboxPending = Math.max(observation.maxOutboxPending, platform.outboxPending);

    cycle += 1;
  }

  const merged: BenchmarkRunReport = {
    profile: 'soak',
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    scenarios: reports,
  };

  return {
    result: {
      phase: 'soak',
      report: merged,
      platform: await collectPlatformSnapshot(pool),
      memory: memorySnapshotMb(),
    },
    observation,
  };
}

export async function assertResourceStabilization(
  pool: Pool,
  _referenceMemory: ReturnType<typeof memorySnapshotMb>,
  _referenceConnections: number,
): Promise<{ memoryLeak: boolean; connectionLeak: boolean; heapDeltaMb: number; connectionDelta: number }> {
  const afterLoad = memorySnapshotMb();
  const afterLoadPlatform = await collectPlatformSnapshot(pool);
  await new Promise((resolve) => setTimeout(resolve, 5_000));
  if (global.gc) {
    global.gc();
  }
  const afterCooldown = memorySnapshotMb();
  const afterCooldownPlatform = await collectPlatformSnapshot(pool);
  const heapDeltaMb = afterCooldown.heapUsedMb - afterLoad.heapUsedMb;
  const connectionDelta =
    afterCooldownPlatform.dbConnections - afterLoadPlatform.dbConnections;
  return {
    memoryLeak: heapDeltaMb > LEAK_HEAP_GROWTH_MB,
    connectionLeak: connectionDelta > LEAK_CONNECTION_DELTA,
    heapDeltaMb,
    connectionDelta,
  };
}

export function aggregateLatencyPercentiles(reports: BenchmarkScenarioReport[]): {
  p95: number | null;
  p99: number | null;
} {
  const p95Values = reports.map((report) => report.latencyMs.p95).filter((value): value is number => value !== null);
  const p99Values = reports.map((report) => report.latencyMs.p99).filter((value): value is number => value !== null);
  return {
    p95: p95Values.length === 0 ? null : Math.max(...p95Values),
    p99: p99Values.length === 0 ? null : Math.max(...p99Values),
  };
}

export function maxErrorRate(reports: BenchmarkScenarioReport[]): number {
  return reports.reduce((max, report) => Math.max(max, report.errorRate), 0);
}
