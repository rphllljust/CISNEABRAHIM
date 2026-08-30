import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { resetTokenStoreForTests } from '../auth/storage/token-store';
import { createDashboardFetchMock } from '../test/dashboard-fetch-mock';
import { loginAndReachApp } from '../test/login-ui-helpers';
import { requestUrl } from '../test/request-url';
import { createShellFetchMock } from '../test/shell-fetch-mock';

describe('operational dashboard e2e (frontend)', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    sessionStorage.clear();
    vi.unstubAllGlobals();
    window.history.pushState({}, '', '/login');
  });

  async function login(user: ReturnType<typeof userEvent.setup>) {
    await loginAndReachApp(user);
  }

  it('loads executive dashboard with attention, charts and shortcuts from a single API call', async () => {
    const shellMock = createShellFetchMock();
    const dashboardMock = createDashboardFetchMock();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = requestUrl(input);
      if (url.includes('/api/v1/dashboard/executive')) {
        return dashboardMock(input, init);
      }
      return shellMock(input, init);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    const user = userEvent.setup();
    await login(user);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /aten.{1,2}o necess.{1,2}ria/i })).toBeInTheDocument();
    });

    const dashboard = within(screen.getByRole('main'));
    expect(dashboard.getByRole('link', { name: /OS vencidas: 3 itens/i })).toBeInTheDocument();
    expect(dashboard.getByText('Maior atraso: 8 dia(s)')).toBeInTheDocument();
    expect(dashboard.getByRole('heading', { name: /vis.{1,2}o operacional/i })).toBeInTheDocument();
    expect(dashboard.getByRole('heading', { name: /indicadores principais/i })).toBeInTheDocument();
    expect(dashboard.getByRole('heading', { name: /produtividade/i })).toBeInTheDocument();
    expect(dashboard.getByRole('link', { name: /ir para solicita/i })).toBeInTheDocument();

    const dashboardCalls = fetchMock.mock.calls.filter(([callInput]) =>
      requestUrl(callInput).includes('/api/v1/dashboard/executive'),
    );
    expect(dashboardCalls.length).toBeGreaterThanOrEqual(1);
    expect(requestUrl(dashboardCalls[0]![0])).toContain('period=week');
  });

  it('reflects period filter in URL when user changes period', async () => {
    const shellMock = createShellFetchMock();
    const dashboardMock = createDashboardFetchMock();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = requestUrl(input);
      if (url.includes('/api/v1/dashboard/executive')) {
        return dashboardMock(input, init);
      }
      return shellMock(input, init);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    const user = userEvent.setup();
    await login(user);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Período' })).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByRole('combobox', { name: 'Período' }), 'month');

    await waitFor(() => {
      expect(window.location.search).toContain('period=month');
      expect(fetchMock.mock.calls.some(([callInput]) => requestUrl(callInput).includes('period=month'))).toBe(
        true,
      );
    });
  });
});
