import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getTestDatabaseUrl } from '../test/load-vitest-env';
import { analyzeQueryPlan, detectDbAnalysisIssues } from '../performance/db/db-query-analyzer';
import {
  applyPerformanceTestEnv,
  createPerformanceHarness,
} from '../performance/benchmark/benchmark-harness';
import { loadPerformanceDatasetConfig } from '../performance/config/performance-dataset.config';
import { seedPerformanceDataset } from '../performance/synthetic/performance-dataset.seeder';
import {
  aggregateLatencyPercentiles,
  assertResourceStabilization,
  maxErrorRate,
  runBenchmarkPhase,
  runSoakPhase,
  runSpikePhase,
  runStressRamp,
} from './performance-stress-phases';
import {
  buildCriticalCommandScenarios,
  buildHighVolumeReadScenarios,
  buildOperationalLoadScenarios,
} from './performance-stress-scenarios';
import { collectPlatformSnapshot, snapshotDeadlockDelta } from './platform-snapshot';
import { assertPostStressIntegrity } from './post-stress-integrity';

const SOAK_SECONDS = Number.parseInt(process.env['PERF_SOAK_SECONDS'] ?? '20', 10);

describe('performance, stress & soak (controlled environment)', () => {
  const testDatabaseUrl = getTestDatabaseUrl();
  let pool: Pool | undefined;

  beforeAll(() => {
    if (!testDatabaseUrl) {
      throw new Error(
        'TEST_DATABASE_URL is required for performance stress tests. Start PostgreSQL (pnpm db:up), copy .env.example to .env, then run pnpm db:migrate:test.',
      );
    }
    applyPerformanceTestEnv(testDatabaseUrl);
    pool = new Pool({ connectionString: testDatabaseUrl, max: 20 });
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('establishes baseline, survives load phases and preserves data integrity', async () => {
    if (!pool) {
      throw new Error('Performance stress pool was not initialized.');
    }

    const platformBefore = await collectPlatformSnapshot(pool);
    const baselineConnections = platformBefore.dbConnections;

    const datasetConfig = loadPerformanceDatasetConfig({ PERF_DATASET_PROFILE: 'smoke' });
    const dataset = await seedPerformanceDataset(pool, datasetConfig);
    const harness = await createPerformanceHarness(pool, dataset);
    const operationalScenarios = buildOperationalLoadScenarios(harness.app, dataset);

    try {
      const baseline = await runBenchmarkPhase(
        harness.app,
        pool,
        'baseline',
        operationalScenarios.map((scenario) => ({
          ...scenario,
          iterations: 6,
          concurrency: 1,
        })),
        harness.context,
      );
      const baselineMemory = baseline.memory;

      const normalLoad = await runBenchmarkPhase(
        harness.app,
        pool,
        'normal-load',
        operationalScenarios,
        harness.context,
      );

      const stress = await runStressRamp(harness.app, pool, operationalScenarios, harness.context);
      const spike = await runSpikePhase(harness.app, pool, operationalScenarios, harness.context);
      const soak = await runSoakPhase(
        harness.app,
        pool,
        operationalScenarios,
        harness.context,
        SOAK_SECONDS,
      );

      const highVolumeReads = buildHighVolumeReadScenarios(harness.app);
      const criticalCommands = buildCriticalCommandScenarios(harness.app);
      const [readPressure, commandUnderReadPressure] = await Promise.all([
        runBenchmarkPhase(harness.app, pool, 'read-pressure', highVolumeReads, harness.context),
        runBenchmarkPhase(
          harness.app,
          pool,
          'critical-under-read-pressure',
          criticalCommands,
          harness.context,
        ),
      ]);

      const stabilization = await assertResourceStabilization(pool, baselineMemory, baselineConnections);
      const platformAfter = await collectPlatformSnapshot(pool);
      const deadlockDelta = snapshotDeadlockDelta(platformBefore, platformAfter);

      const serviceOrderPlan = await analyzeQueryPlan(
        pool,
        'service-orders.list',
        `SELECT id FROM so.service_orders
         WHERE unit_id = $1 AND status = 'RELEASED'::so.service_order_status
         ORDER BY created_at DESC
         LIMIT 25`,
        [datasetConfig.unitId],
      );
      const dbIssues =
        datasetConfig.profile === 'full' ? detectDbAnalysisIssues([serviceOrderPlan]) : [];

      const integrityViolations = await assertPostStressIntegrity(pool);

      const operationalReports = [
        ...baseline.report.scenarios,
        ...normalLoad.report.scenarios,
        ...stress.report.scenarios,
        ...soak.result.report.scenarios,
        ...readPressure.report.scenarios,
        ...commandUnderReadPressure.report.scenarios,
      ];
      const latency = aggregateLatencyPercentiles([
        ...operationalReports,
        ...spike.report.scenarios,
      ]);
      const operationalErrorRate = maxErrorRate(operationalReports);
      const spikeErrorRate = maxErrorRate(spike.report.scenarios);

      expect(baseline.report.scenarios.every((scenario) => scenario.errorRate === 0)).toBe(true);
      expect(normalLoad.report.scenarios.every((scenario) => scenario.errorRate === 0)).toBe(true);
      expect(operationalErrorRate).toBeLessThanOrEqual(0.05);
      expect(spikeErrorRate).toBeLessThanOrEqual(0.2);
      expect(stress.firstBottleneck, 'stress ramp should identify a bottleneck before hard failure').toBeTruthy();
      expect(soak.observation.samples).toBeGreaterThan(0);
      expect(stabilization.memoryLeak).toBe(false);
      expect(stabilization.connectionLeak).toBe(false);
      expect(deadlockDelta).toBe(0);
      expect(dbIssues).toEqual([]);
      expect(integrityViolations).toEqual([]);
      expect(commandUnderReadPressure.report.scenarios[0]?.errorRate ?? 1).toBe(0);

      expect(latency.p95).not.toBeNull();
      expect(latency.p99).not.toBeNull();

      // Surface measured percentiles for the execution log / human report.
      process.env['PERF_STRESS_P95_MS'] = String(latency.p95);
      process.env['PERF_STRESS_P99_MS'] = String(latency.p99);
      console.log(
        `PERF_STRESS_REPORT p95=${latency.p95} p99=${latency.p99} bottleneck=${stress.firstBottleneck} spikeError=${spikeErrorRate}`,
      );
    } finally {
      await harness.app.close();
    }
  }, 600_000);
});
