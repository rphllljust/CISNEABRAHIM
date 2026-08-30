import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getTestDatabaseUrl } from '../test/load-vitest-env';
import { derivePerformanceBudgets } from './config/performance-budgets';
import { loadPerformanceDatasetConfig } from './config/performance-dataset.config';
import {
  applyPerformanceTestEnv,
  createPerformanceHarness,
} from './benchmark/benchmark-harness';
import { BenchmarkRunner } from './benchmark/benchmark-runner';
import { buildReadBenchmarkScenarios } from './benchmark/performance-scenarios';
import { analyzeQueryPlan } from './db/db-query-analyzer';
import { seedPerformanceDataset } from './synthetic/performance-dataset.seeder';

const runFull = process.env['PERF_FULL'] === '1';

describe.runIf(runFull)('performance full benchmarks', () => {
  const testDatabaseUrl = getTestDatabaseUrl();
  let pool: Pool | undefined;

  beforeAll(() => {
    if (!testDatabaseUrl) {
      throw new Error(
        'TEST_DATABASE_URL is required for full performance benchmarks. Start PostgreSQL and run pnpm db:migrate:test.',
      );
    }
    applyPerformanceTestEnv(testDatabaseUrl);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('records baseline metrics for read scenarios', async () => {
    if (!pool) {
      throw new Error('Performance pool was not initialized.');
    }
    const datasetConfig = loadPerformanceDatasetConfig({ PERF_DATASET_PROFILE: 'full' });
    const dataset = await seedPerformanceDataset(pool, datasetConfig);
    const harness = await createPerformanceHarness(pool, dataset);

    try {
      const runner = new BenchmarkRunner(harness.app, {
        profile: 'full',
        pool,
        collectDbPool: true,
      });
      const report = await runner.run(buildReadBenchmarkScenarios(harness.app), harness.context);
      const budgets = derivePerformanceBudgets(report.scenarios);

      expect(report.scenarios.length).toBeGreaterThan(10);
      expect(budgets.every((budget) => budget.p95LatencyMs > 0)).toBe(true);
      expect(report.scenarios.every((scenario) => scenario.errorRate < 0.05)).toBe(true);
    } finally {
      await harness.app.close();
    }
  }, 600_000);

  it('analyzes list queries for sequential scans on indexed filters', async () => {
    const datasetConfig = loadPerformanceDatasetConfig({ PERF_DATASET_PROFILE: 'smoke' });
    await seedPerformanceDataset(pool, datasetConfig);

    const serviceOrderPlan = await analyzeQueryPlan(
      pool,
      'service-orders.list',
      `SELECT id FROM so.service_orders
       WHERE unit_id = $1 AND status = 'RELEASED'::so.service_order_status
       ORDER BY created_at DESC
       LIMIT 25`,
      [datasetConfig.unitId],
    );
    const clientPlan = await analyzeQueryPlan(
      pool,
      'clients.list',
      `SELECT id FROM pty.clients WHERE status = 'ACTIVE' ORDER BY created_at ASC LIMIT 25`,
    );

    expect(serviceOrderPlan.plan.join('\n')).toMatch(/Index|Bitmap/i);
    expect(clientPlan.plan.join('\n')).toMatch(/Index|Bitmap|Seq Scan/i);
  }, 120_000);
});
