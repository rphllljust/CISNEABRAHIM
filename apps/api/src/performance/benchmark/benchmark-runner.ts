import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { Pool } from 'pg';
import type {
  BenchmarkRunReport,
  BenchmarkSample,
  BenchmarkScenarioReport,
  PerformanceScenarioContext,
} from '../domain/benchmark-types';
import { memorySnapshotMb, summarizeBenchmarkSamples } from '../domain/benchmark-stats';

export type BenchmarkScenario = {
  name: string;
  iterations: number;
  concurrency: number;
  run: (context: PerformanceScenarioContext) => Promise<BenchmarkSample>;
};

export type BenchmarkRunnerOptions = {
  profile: string;
  pool?: Pool;
  collectDbPool?: boolean;
};

async function runConcurrent<T>(
  concurrency: number,
  iterations: number,
  worker: (index: number) => Promise<T>,
): Promise<T[]> {
  const results: T[] = [];
  let nextIndex = 0;

  async function consume(): Promise<void> {
    while (nextIndex < iterations) {
      const current = nextIndex;
      nextIndex += 1;
      results.push(await worker(current));
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, iterations) }, () => consume());
  await Promise.all(workers);
  return results;
}

export class BenchmarkRunner {
  constructor(
    private readonly app: NestFastifyApplication,
    private readonly options: BenchmarkRunnerOptions,
  ) {}

  async run(scenarios: BenchmarkScenario[], context: PerformanceScenarioContext): Promise<BenchmarkRunReport> {
    const startedAt = new Date().toISOString();
    const reports: BenchmarkScenarioReport[] = [];

    for (const scenario of scenarios) {
      const scenarioStarted = performance.now();
      const samples = await runConcurrent(scenario.concurrency, scenario.iterations, async () =>
        scenario.run(context),
      );
      const scenarioDurationMs = performance.now() - scenarioStarted;
      const summary = summarizeBenchmarkSamples(samples, scenarioDurationMs);

      reports.push({
        scenario: scenario.name,
        iterations: scenario.iterations,
        concurrency: scenario.concurrency,
        durationMs: Number(scenarioDurationMs.toFixed(2)),
        throughputRps: Number(summary.throughputRps.toFixed(2)),
        errorRate: summary.errorRate,
        latencyMs: summary.latencyMs,
        memory: memorySnapshotMb(),
        dbPool: this.options.collectDbPool ? await this.collectDbPoolSnapshot() : undefined,
      });
    }

    return {
      profile: this.options.profile,
      startedAt,
      endedAt: new Date().toISOString(),
      scenarios: reports,
    };
  }

  private async collectDbPoolSnapshot(): Promise<BenchmarkScenarioReport['dbPool']> {
    if (!this.options.pool) {
      return undefined;
    }
    const poolStats = await this.options.pool.query<{
      total: string;
      idle: string;
      waiting: string;
    }>(
      `SELECT
         COUNT(*)::text AS total,
         COUNT(*) FILTER (WHERE state = 'idle')::text AS idle,
         COUNT(*) FILTER (WHERE wait_event_type IS NOT NULL)::text AS waiting
       FROM pg_stat_activity
       WHERE datname = current_database()`,
    );
    const row = poolStats.rows[0];
    return {
      total: Number.parseInt(row?.total ?? '0', 10),
      idle: Number.parseInt(row?.idle ?? '0', 10),
      waiting: Number.parseInt(row?.waiting ?? '0', 10),
      queryLatencyMs: { count: 0, p50: null, p95: null, p99: null, max: null },
    };
  }
}

export async function injectTimed(
  app: NestFastifyApplication,
  request: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    url: string;
    headers?: Record<string, string>;
    payload?: unknown;
  },
): Promise<BenchmarkSample> {
  const started = performance.now();
  const response = await app.inject({
    method: request.method,
    url: request.url,
    headers: request.headers,
    payload: request.payload as Record<string, unknown> | undefined,
  });
  const durationMs = performance.now() - started;
  return {
    durationMs,
    statusCode: response.statusCode,
    ok: isSuccessfulApiResponse(response.statusCode, response.body),
  };
}

function isSuccessfulApiResponse(statusCode: number, body: string): boolean {
  if (statusCode < 200 || statusCode >= 400) {
    return false;
  }
  try {
    const parsed = JSON.parse(body) as { error?: unknown };
    return parsed.error === undefined;
  } catch {
    return true;
  }
}
