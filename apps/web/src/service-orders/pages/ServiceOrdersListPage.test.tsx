import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceOrdersListPage } from './ServiceOrdersListPage';
import {
  createServiceOrdersFetchMock,
  MOCK_SERVICE_ORDER_ID,
} from '../../test/service-orders-fetch-mock';
import { renderWithProviders } from '../../test/render-with-providers';
import { resetTokenStoreForTests, tokenStore } from '../../auth/storage/token-store';

describe('ServiceOrdersListPage', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    tokenStore.setTokens('access-token', 'refresh-token');
    vi.unstubAllGlobals();
  });

  it('loads service orders and exposes operational links', async () => {
    vi.stubGlobal('fetch', createServiceOrdersFetchMock());
    renderWithProviders(<ServiceOrdersListPage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'OS-2026-DEMO01' })).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: 'OS-2026-DEMO01' })).toHaveAttribute(
      'href',
      `/app/service-orders/${MOCK_SERVICE_ORDER_ID}/planning`,
    );
    expect(screen.getByRole('link', { name: 'Planejamento' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Execução' })).toHaveAttribute(
      'href',
      `/app/service-orders/${MOCK_SERVICE_ORDER_ID}/execution`,
    );
    expect(screen.getByRole('link', { name: 'Medição' })).toHaveAttribute(
      'href',
      `/app/service-orders/${MOCK_SERVICE_ORDER_ID}/measurement`,
    );
  });

  it('shows denied state when list access is forbidden', async () => {
    vi.stubGlobal('fetch', createServiceOrdersFetchMock({ serviceOrderListAllowed: false }));
    renderWithProviders(<ServiceOrdersListPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/não tem permissão para listar ordens de serviço/i);
    });
  });
});
