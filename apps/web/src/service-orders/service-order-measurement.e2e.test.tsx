import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { resetTokenStoreForTests, tokenStore } from '../auth/storage/token-store';
import {
  createServiceOrdersFetchMock,
  MOCK_SERVICE_ORDER_ID,
} from '../test/service-orders-fetch-mock';

describe('service order measurement flow e2e (frontend)', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    tokenStore.setTokens('access-token', 'refresh-token');
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it('renders measurement review route with comparative layout', async () => {
    vi.stubGlobal(
      'fetch',
      createServiceOrdersFetchMock({
        orderCompleted: true,
        seedMeasurement: 'draft-aligned',
      }),
    );
    window.history.pushState({}, '', `/app/service-orders/${MOCK_SERVICE_ORDER_ID}/measurement`);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /OS-2026-DEMO01/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/conferência de medição/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /planejado · realizado · medido/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /execução/i })).toBeInTheDocument();
  });

  it('walks submit and review workflow end to end', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      createServiceOrdersFetchMock({
        orderCompleted: true,
        seedMeasurement: 'draft-aligned',
      }),
    );
    window.history.pushState({}, '', `/app/service-orders/${MOCK_SERVICE_ORDER_ID}/measurement`);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submeter medição/i })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: /submeter medição/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /iniciar análise/i })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: /iniciar análise/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /aprovar medição/i })).toBeEnabled();
    });
  });

  it('links from completed execution page to measurement review', async () => {
    vi.stubGlobal(
      'fetch',
      createServiceOrdersFetchMock({
        orderCompleted: true,
        seedMeasurement: 'draft-aligned',
      }),
    );
    window.history.pushState({}, '', `/app/service-orders/${MOCK_SERVICE_ORDER_ID}/execution`);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /abrir conferência de medição/i })).toBeInTheDocument();
    });
  });

  it('shows version conflict banner and reload action', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      createServiceOrdersFetchMock({
        orderCompleted: true,
        seedMeasurement: 'under_review',
        measurementVersionConflict: true,
      }),
    );
    window.history.pushState({}, '', `/app/service-orders/${MOCK_SERVICE_ORDER_ID}/measurement`);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /aprovar medição/i })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: /aprovar medição/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('checkbox'));
    await user.click(within(dialog).getByRole('button', { name: /aprovar medição/i }));

    await waitFor(() => {
      expect(screen.getByText(/medição desatualizada/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /recarregar medição/i })).toBeInTheDocument();
    });
  }, 20000);
});
