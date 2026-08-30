import { vi } from 'vitest';
import { requestUrl } from './request-url';

export const MOCK_IDENTITY_ID = '11111111-1111-4111-8111-111111111111';
export const MOCK_SESSION_ID = '22222222-2222-4222-8222-222222222222';

export type ShellFetchMockOptions = {
  probeAllowed?: boolean;
};

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

export function createShellFetchMock(options: ShellFetchMockOptions = {}) {
  const probeAllowed = options.probeAllowed ?? true;

  return vi.fn(async (input: RequestInfo, init?: RequestInit) => {
    const url = requestUrl(input);
    const method = init?.method ?? 'GET';
    const pathname = new URL(url).pathname;

    if (url.endsWith('/api/v1/auth/login') && method === 'POST') {
      const rawBody = init?.body;
      const body = JSON.parse(typeof rawBody === 'string' ? rawBody : '{}') as {
        login: string;
        password: string;
      };
      if (body.password === 'Password1!') {
        return jsonResponse({
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          tokenType: 'Bearer',
          expiresIn: 900,
          session: { id: MOCK_SESSION_ID, expiresAt: new Date().toISOString(), status: 'active' },
        });
      }
      return jsonResponse(
        { error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid credentials.' } },
        401,
      );
    }

    if (url.endsWith('/api/v1/auth/session') && method === 'GET') {
      const auth = init?.headers ? new Headers(init.headers).get('authorization') : null;
      if (auth === 'Bearer expired-token') {
        return jsonResponse({ error: { code: 'AUTH_SESSION_EXPIRED', message: 'Expired.' } }, 401);
      }
      if (auth?.startsWith('Bearer ')) {
        return jsonResponse({
          identityId: MOCK_IDENTITY_ID,
          session: { id: MOCK_SESSION_ID, expiresAt: new Date().toISOString(), status: 'active' },
        });
      }
      return jsonResponse({ error: { code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized.' } }, 401);
    }

    if (url.endsWith('/api/v1/auth/refresh') && method === 'POST') {
      return jsonResponse({
        accessToken: 'access-token-2',
        refreshToken: 'refresh-token-2',
        tokenType: 'Bearer',
        expiresIn: 900,
        session: { id: MOCK_SESSION_ID, expiresAt: new Date().toISOString(), status: 'active' },
      });
    }

    if (url.endsWith('/api/v1/auth/logout') && method === 'POST') {
      return jsonResponse({ success: true });
    }

    if (url.endsWith('/api/v1/auth/logout-all') && method === 'POST') {
      return jsonResponse({ success: true });
    }

    if (url.endsWith('/api/v1/authz/probe') && method === 'GET') {
      if (!probeAllowed) {
        return jsonResponse({ error: { code: 'AUTHZ_FORBIDDEN', message: 'Forbidden.' } }, 403);
      }
      return jsonResponse({
        status: 'ok',
        identityId: MOCK_IDENTITY_ID,
        sessionId: MOCK_SESSION_ID,
      });
    }

    if (url.endsWith('/api/v1/dashboard/operational') && method === 'GET') {
      return jsonResponse({
        generatedAt: new Date().toISOString(),
        visibility: {
          serviceRequests: true,
          serviceOrders: false,
          measurements: false,
          billing: false,
          documents: false,
          resources: false,
        },
        attention: [],
        operation: [],
        deadlines: [],
        finance: [],
        shortcuts: [],
      });
    }

    if (pathname === '/api/v1/clients' && method === 'GET') {
      return jsonResponse({ error: { code: 'CLIENT_DENIED', message: 'Forbidden.' } }, 403);
    }

    if (pathname === '/api/v1/catalog/service-definitions' && method === 'GET') {
      return jsonResponse({ error: { code: 'CATALOG_DENIED', message: 'Forbidden.' } }, 403);
    }

    if (pathname === '/api/v1/resources/physical-assets' && method === 'GET') {
      return jsonResponse({ error: { code: 'ASSET_DENIED', message: 'Forbidden.' } }, 403);
    }

    if (pathname.startsWith('/api/v1/clients/') && method === 'GET') {
      return jsonResponse({ error: { code: 'CLIENT_NOT_FOUND', message: 'Not found.' } }, 404);
    }

    if (pathname.startsWith('/api/v1/clients/') && (method === 'PATCH' || method === 'POST')) {
      return jsonResponse({ error: { code: 'CLIENT_DENIED', message: 'Forbidden.' } }, 403);
    }

    return jsonResponse({ error: { code: 'UNKNOWN', message: 'Not found' } }, 404);
  });
}
