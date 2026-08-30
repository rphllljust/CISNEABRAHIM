import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { resetTokenStoreForTests, tokenStore } from '../auth/storage/token-store';
import {
  createServiceOrdersFetchMock,
  MOCK_SERVICE_ORDER_ID,
} from '../test/service-orders-fetch-mock';

describe('service orders list e2e (frontend)', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    tokenStore.setTokens('access-token', 'refresh-token');
    sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.stubGlobal('fetch', createServiceOrdersFetchMock());
  });

  it('loads global list with operational action links', async () => {
    window.history.pushState({}, '', '/app/service-orders');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /ordens de serviço/i })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'OS-2026-DEMO01' })).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: 'OS-2026-DEMO01' })).toHaveAttribute(
      'href',
      `/app/service-orders/${MOCK_SERVICE_ORDER_ID}/planning`,
    );
    expect(screen.getByRole('link', { name: 'Execução' })).toHaveAttribute(
      'href',
      `/app/service-orders/${MOCK_SERVICE_ORDER_ID}/execution`,
    );
    expect(screen.getByRole('link', { name: 'Medição' })).toHaveAttribute(
      'href',
      `/app/service-orders/${MOCK_SERVICE_ORDER_ID}/measurement`,
    );
  }, 20000);

  it('preserves overdue filter from dashboard attention URL', async () => {
    window.history.pushState({}, '', '/app/service-orders?filter=overdue');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/prazo operacional vencido/i)).toBeInTheDocument();
    });
  }, 20000);

  it('preserves active status filter from dashboard KPI URL', async () => {
    window.history.pushState({}, '', '/app/service-orders?status=active');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText(/status: liberada/i)).toBeInTheDocument();
    });

    const statusFilter = screen.getByRole('combobox', { name: 'Status' });
    expect(statusFilter).toHaveValue('active');
  }, 20000);
});
