import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { BenchmarkScenario } from './benchmark-runner';
import { injectTimed } from './benchmark-runner';
import { authHeaders } from './benchmark-harness';

export function buildReadBenchmarkScenarios(app: NestFastifyApplication): BenchmarkScenario[] {
  return [
    {
      name: 'auth.session',
      iterations: 10,
      concurrency: 2,
      run: async (context) =>
        injectTimed(app, {
          method: 'GET',
          url: '/api/v1/auth/session',
          headers: authHeaders(context.accessToken),
        }),
    },
    {
      name: 'clients.list',
      iterations: 12,
      concurrency: 3,
      run: async (context) =>
        injectTimed(app, {
          method: 'GET',
          url: '/api/v1/clients?limit=25&offset=0',
          headers: authHeaders(context.accessToken),
        }),
    },
    {
      name: 'search.advanced',
      iterations: 10,
      concurrency: 2,
      run: async (context) =>
        injectTimed(app, {
          method: 'GET',
          url: '/api/v1/search?q=Synthetic&types=CLIENT,SERVICE_ORDER&limit=20&offset=0',
          headers: authHeaders(context.accessToken),
        }),
    },
    {
      name: 'service-orders.list',
      iterations: 12,
      concurrency: 3,
      run: async (context) =>
        injectTimed(app, {
          method: 'GET',
          url: '/api/v1/service-orders?limit=25&offset=0',
          headers: authHeaders(context.accessToken),
        }),
    },
    {
      name: 'dashboard.operational',
      iterations: 8,
      concurrency: 2,
      run: async (context) =>
        injectTimed(app, {
          method: 'GET',
          url: '/api/v1/dashboard/operational',
          headers: authHeaders(context.accessToken),
        }),
    },
    {
      name: 'service-orders.detail',
      iterations: 10,
      concurrency: 2,
      run: async (context) =>
        injectTimed(app, {
          method: 'GET',
          url: `/api/v1/service-orders/${context.sampleServiceOrderId}`,
          headers: authHeaders(context.accessToken),
        }),
    },
    {
      name: 'resources.availability',
      iterations: 8,
      concurrency: 2,
      run: async (context) =>
        injectTimed(app, {
          method: 'GET',
          url: '/api/v1/resources/physical-assets?allocationStatus=AVAILABLE&limit=25',
          headers: authHeaders(context.accessToken),
        }),
    },
    {
      name: 'measurements.list',
      iterations: 8,
      concurrency: 2,
      run: async (context) =>
        injectTimed(app, {
          method: 'GET',
          url: `/api/v1/service-orders/${context.sampleServiceOrderId}/measurements`,
          headers: authHeaders(context.accessToken),
        }),
    },
    {
      name: 'billing.list',
      iterations: 8,
      concurrency: 2,
      run: async (context) =>
        injectTimed(app, {
          method: 'GET',
          url: `/api/v1/service-orders/${context.sampleServiceOrderId}/billing-records`,
          headers: authHeaders(context.accessToken),
        }),
    },
    {
      name: 'reports.catalog',
      iterations: 6,
      concurrency: 2,
      run: async (context) =>
        injectTimed(app, {
          method: 'GET',
          url: '/api/v1/reports/catalog',
          headers: authHeaders(context.accessToken),
        }),
    },
    {
      name: 'reports.preview',
      iterations: 6,
      concurrency: 2,
      run: async (context) =>
        injectTimed(app, {
          method: 'GET',
          url: '/api/v1/reports/exports/preview?reportType=SERVICE_ORDERS_BY_PERIOD',
          headers: authHeaders(context.accessToken),
        }),
    },
    {
      name: 'observability.metrics',
      iterations: 4,
      concurrency: 1,
      run: async (context) =>
        injectTimed(app, {
          method: 'GET',
          url: '/api/v1/observability/metrics',
          headers: authHeaders(context.accessToken),
        }),
    },
  ];
}

export function buildSmokeBenchmarkScenarios(app: NestFastifyApplication): BenchmarkScenario[] {
  const all = buildReadBenchmarkScenarios(app);
  const smokeNames = new Set([
    'auth.session',
    'clients.list',
    'search.advanced',
    'service-orders.list',
    'dashboard.operational',
  ]);
  return all
    .filter((scenario) => smokeNames.has(scenario.name))
    .map((scenario) => ({
      ...scenario,
      iterations: Math.min(scenario.iterations, 4),
      concurrency: 1,
    }));
}
