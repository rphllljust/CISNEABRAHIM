import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { resetTokenStoreForTests } from '../auth/storage/token-store';
import { createDashboardFetchMock } from '../test/dashboard-fetch-mock';
import { createShellFetchMock } from '../test/shell-fetch-mock';

describe('operational dashboard e2e (frontend)', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    sessionStorage.clear();
    vi.unstubAllGlobals();
    window.history.pushState({}, '', '/login');
  });

  async function login(user: ReturnType<typeof userEvent.setup>) {
    await user.type(await screen.findByLabelText(/login/i), 'user@test');
    await user.type(screen.getByLabelText(/password/i), 'Password1!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /painel operacional/i })).toBeInTheDocument();
    });
  }

  it('loads dashboard with attention metrics and shortcuts from a single API call', async () => {
    const shellMock = createShellFetchMock();
    const dashboardMock = createDashboardFetchMock();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/api/v1/dashboard/operational')) {
        return dashboardMock(input, init);
      }
      return shellMock(input, init);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    const user = userEvent.setup();
    await login(user);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /atenção necessária/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'OS atrasadas: 3 itens' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir para solicitações de serviço' })).toBeInTheDocument();

    const dashboardCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes('/api/v1/dashboard/operational'),
    );
    expect(dashboardCalls.length).toBeGreaterThanOrEqual(1);
  });
});
