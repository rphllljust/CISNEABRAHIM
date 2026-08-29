import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { resetTokenStoreForTests } from '../auth/storage/token-store';
import { requestUrl } from '../test/request-url';

const identityId = '11111111-1111-4111-8111-111111111111';
const sessionId = '22222222-2222-4222-8222-222222222222';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function createFetchMock() {
  return vi.fn(async (input: RequestInfo, init?: RequestInit) => {
    const url = requestUrl(input);
    const method = init?.method ?? 'GET';

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
          session: { id: sessionId, expiresAt: new Date().toISOString(), status: 'active' },
        });
      }
      return jsonResponse(
        { error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid credentials.' } },
        401,
      );
    }

    if (url.endsWith('/api/v1/auth/session') && method === 'GET') {
      const auth = init?.headers ? new Headers(init.headers).get('authorization') : null;
      if (auth?.startsWith('Bearer ')) {
        return jsonResponse({
          identityId,
          session: { id: sessionId, expiresAt: new Date().toISOString(), status: 'active' },
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
        session: { id: sessionId, expiresAt: new Date().toISOString(), status: 'active' },
      });
    }

    if (url.endsWith('/api/v1/auth/logout') && method === 'POST') {
      return jsonResponse({ success: true });
    }

    if (url.endsWith('/api/v1/auth/logout-all') && method === 'POST') {
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: { code: 'UNKNOWN', message: 'Not found' } }, 404);
  });
}

describe('auth flow e2e (frontend)', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    sessionStorage.clear();
    vi.unstubAllGlobals();
    window.history.pushState({}, '', '/');
  });

  it('redirects unauthenticated users to login and protects /app', async () => {
    vi.stubGlobal('fetch', createFetchMock());
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it('logs in, reaches protected route, refreshes session, and logs out', async () => {
    const fetchMock = createFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    window.history.pushState({}, '', '/login');
    render(<App />);

    await user.type(await screen.findByLabelText(/login/i), 'user@test');
    await user.type(screen.getByLabelText(/password/i), 'Password1!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/authenticated session/i)).toBeInTheDocument();
    });

    expect(screen.getByText(identityId)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/session'),
      expect.objectContaining({ method: 'GET' }),
    );

    await user.click(screen.getByRole('button', { name: /log out$/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  it('bootstraps session from refresh token in sessionStorage', async () => {
    sessionStorage.setItem('cisne.refreshToken', 'refresh-token');
    const fetchMock = createFetchMock();
    vi.stubGlobal('fetch', fetchMock);

    window.history.pushState({}, '', '/app');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/authenticated session/i)).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/refresh'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('shows service unavailable on network errors during bootstrap', async () => {
    sessionStorage.setItem('cisne.refreshToken', 'refresh-token');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    window.history.pushState({}, '', '/app');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /service unavailable/i })).toBeInTheDocument();
    });
  });
});
