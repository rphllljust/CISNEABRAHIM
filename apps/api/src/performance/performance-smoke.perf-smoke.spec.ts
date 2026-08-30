import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getTestDatabaseUrl } from '../test/load-vitest-env';
import { assertWithinBudget, derivePerformanceBudgets } from './config/performance-budgets';
import { loadPerformanceDatasetConfig } from './config/performance-dataset.config';
import {
  applyPerformanceTestEnv,
  createPerformanceHarness,
} from './benchmark/benchmark-harness';
import { BenchmarkRunner } from './benchmark/benchmark-runner';
import { buildSmokeBenchmarkScenarios } from './benchmark/performance-scenarios';
import { seedPerformanceDataset } from './synthetic/performance-dataset.seeder';

describe('performance smoke benchmarks', () => {
  const testDatabaseUrl = getTestDatabaseUrl();
  let pool: Pool | undefined;

  beforeAll(() => {
    if (!testDatabaseUrl) {
      throw new Error(
        'TEST_DATABASE_URL is required for performance smoke benchmarks. Start PostgreSQL (pnpm db:up), copy .env.example to .env, then run pnpm db:migrate:test.',
      );
    }
    applyPerformanceTestEnv(testDatabaseUrl);
    pool = new Pool({ connectionString: testDatabaseUrl });
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('meets smoke budgets for core read scenarios', async () => {
    if (!pool) {
      throw new Error('Performance pool was not initialized.');
    }
    const datasetConfig = loadPerformanceDatasetConfig({ PERF_DATASET_PROFILE: 'smoke' });
    const dataset = await seedPerformanceDataset(pool, datasetConfig);
    const harness = await createPerformanceHarness(pool, dataset);

    try {
      const runner = new BenchmarkRunner(harness.app, {
        profile: 'smoke',
        pool,
        collectDbPool: true,
      });
      const report = await runner.run(buildSmokeBenchmarkScenarios(harness.app), harness.context);
      const budgets = derivePerformanceBudgets(report.scenarios);

      const violations = report.scenarios.flatMap((scenario) => {
        const budget = budgets.find((entry) => entry.scenario === scenario.scenario);
        return budget ? assertWithinBudget(scenario, budget) : [];
      });

      expect(violations, violations.join('\n')).toEqual([]);
      expect(report.scenarios.every((scenario) => scenario.errorRate === 0)).toBe(true);
    } finally {
      await harness.app.close();
    }
  }, 180_000);
});
