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
        const headers = new Headers(init?.headers);
        if (!headers.get('authorization')?.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
        }
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
      'login',
      'observability_metrics',
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

  it('accepts observability 403 as authorization-protected endpoint', async () => {
    const fetchImpl = async (input: string | URL, init?: RequestInit): Promise<Response> => {
      const url = String(input);
      if (url.endsWith('/health/live') || url.endsWith('/health/ready')) {
        return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
      }
      if (url.endsWith('/auth/login')) {
        return new Response(JSON.stringify({ accessToken: 'smoke-token' }), { status: 200 });
      }
      if (url.endsWith('/observability/metrics')) {
        const headers = new Headers(init?.headers);
        if (!headers.get('authorization')) {
          return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 });
        }
        return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 });
      }
      if (init?.headers && new Headers(init.headers).get('authorization')) {
        return new Response(JSON.stringify({ items: [] }), { status: 200 });
      }
      return new Response('unexpected', { status: 500 });
    };

    const result = await runHmlDeploySmoke(
      { baseUrl: 'http://hml-api.invalid', login: 'x', password: 'y' },
      fetchImpl as typeof fetch,
    );

    expect(result.status).toBe('PASS');
    const metricsCheck = result.checks.find((check) => check.id === 'observability_metrics');
    expect(metricsCheck?.passed).toBe(true);
    expect(metricsCheck?.statusCode).toBe(403);
  });
});
