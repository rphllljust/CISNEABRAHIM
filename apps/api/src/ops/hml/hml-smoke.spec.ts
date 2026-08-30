import { describe, expect, it } from 'vitest';
import { runHmlDeploySmoke } from './hml-smoke';

describe('hml-smoke', () => {
  it('runs post-deploy smoke checks across core domains', async () => {
    const fetchImpl = async (input: string | URL, init?: RequestInit): Promise<Response> => {
      const url = String(input);
      if (url.endsWith('/health/live') || url.endsWith('/health/ready')) {
        return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
      }
      if (url.endsWith('/observability/metrics')) {
        return new Response(JSON.stringify({ http: { requests: 1 } }), { status: 200 });
      }
      if (url.endsWith('/auth/login')) {
        return new Response(JSON.stringify({ accessToken: 'smoke-token' }), { status: 200 });
      }
      if (init?.method === 'GET' && init.headers && 'authorization' in (init.headers as Record<string, string>)) {
        if (url.includes('/execution')) {
          return new Response(JSON.stringify({ entries: [] }), { status: 200 });
        }
        if (url.includes('/measurements') || url.includes('/billing-records')) {
          return new Response(JSON.stringify({ items: [] }), { status: 200 });
        }
        return new Response(JSON.stringify({ items: [] }), { status: 200 });
      }
      return new Response('unexpected', { status: 500 });
    };

    const result = await runHmlDeploySmoke(
      {
        baseUrl: 'http://hml-api.invalid',
        login: 'hml-admin@cisne.invalid',
        password: 'Synthetic-HML-Only-Password-123!',
      },
      fetchImpl as typeof fetch,
    );

    expect(result.status).toBe('PASS');
    expect(result.checks.map((check) => check.id)).toEqual([
      'health_live',
      'health_ready',
      'observability_metrics',
      'login',
      'clients',
      'requests',
      'service_orders',
      'documents',
      'execution',
      'measurements',
      'billing',
    ]);
  });

  it('fails when login does not return a token', async () => {
    const fetchImpl = async (input: string | URL): Promise<Response> => {
      const url = String(input);
      if (url.includes('/health/')) {
        return new Response('{}', { status: 200 });
      }
      if (url.includes('/observability/metrics')) {
        return new Response('{}', { status: 200 });
      }
      if (url.includes('/auth/login')) {
        return new Response('{}', { status: 401 });
      }
      return new Response('fail', { status: 500 });
    };

    const result = await runHmlDeploySmoke(
      { baseUrl: 'http://hml-api.invalid', login: 'x', password: 'y' },
      fetchImpl as typeof fetch,
    );
    expect(result.status).toBe('FAIL');
  });
});
