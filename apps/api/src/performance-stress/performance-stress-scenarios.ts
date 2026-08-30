import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { BenchmarkScenario } from '../performance/benchmark/benchmark-runner';
import { injectTimed } from '../performance/benchmark/benchmark-runner';
import { buildReadBenchmarkScenarios } from '../performance/benchmark/performance-scenarios';
import type { SeededPerformanceDataset } from '../performance/synthetic/performance-dataset.seeder';

export function buildOperationalLoadScenarios(
  app: NestFastifyApplication,
  dataset: SeededPerformanceDataset,
): BenchmarkScenario[] {
  const reads = buildReadBenchmarkScenarios(app);
  const operationalNames = new Set([
    'auth.session',
    'clients.list',
    'search.advanced',
    'dashboard.operational',
    'service-orders.list',
    'service-orders.detail',
    'resources.availability',
    'measurements.list',
    'billing.list',
    'reports.catalog',
    'reports.preview',
  ]);

  const readScenarios = reads
    .filter((scenario) => operationalNames.has(scenario.name))
    .map((scenario) => ({
      ...scenario,
      iterations: 12,
      concurrency: 3,
    }));

  const loginScenario: BenchmarkScenario = {
    name: 'auth.login',
    iterations: 10,
    concurrency: 3,
    run: async () =>
      injectTimed(app, {
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          login: dataset.login,
          password: dataset.password,
        },
      }),
  };

  return [loginScenario, ...readScenarios];
}

export function buildHighVolumeReadScenarios(app: NestFastifyApplication): BenchmarkScenario[] {
  return buildReadBenchmarkScenarios(app)
    .filter((scenario) =>
      ['search.advanced', 'dashboard.operational', 'reports.preview', 'reports.catalog'].includes(
        scenario.name,
      ),
    )
    .map((scenario) => ({
      ...scenario,
      iterations: 24,
      concurrency: 8,
    }));
}

export function buildCriticalCommandScenarios(app: NestFastifyApplication): BenchmarkScenario[] {
  return buildReadBenchmarkScenarios(app)
    .filter((scenario) => scenario.name === 'service-orders.list')
    .map((scenario) => ({
      ...scenario,
      iterations: 16,
      concurrency: 2,
    }));
}
