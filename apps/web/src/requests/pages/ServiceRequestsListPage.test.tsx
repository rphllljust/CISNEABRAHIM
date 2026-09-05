import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceRequestsListPage } from './ServiceRequestsListPage';
import { createRequestsFetchMock } from '../../test/requests-fetch-mock';
import { renderWithProviders } from '../../test/render-with-providers';
import { tokenStore, resetTokenStoreForTests } from '../../auth/storage/token-store';
import { SERVICE_REQUEST_STATUSES } from '../types/service-request.types';

describe('ServiceRequestsListPage', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    tokenStore.setTokens('access-token', 'refresh-token');
    vi.unstubAllGlobals();
  });

  it('renders paginated list from backend', async () => {
    vi.stubGlobal('fetch', createRequestsFetchMock());
    renderWithProviders(<ServiceRequestsListPage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'SR-2026-DEMO01' })).toBeInTheDocument();
    });
    expect(screen.getByRole('region', { name: /resumo de solicitações/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filtrar todas as solicitações/i })).toHaveTextContent('1');
    expect(screen.getByRole('table', { name: /lista de solicitações/i })).toBeInTheDocument();
  });

  it('shows access denied when list is forbidden', async () => {
    vi.stubGlobal('fetch', createRequestsFetchMock({ requestListAllowed: false }));
    renderWithProviders(<ServiceRequestsListPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/não tem permissão/i);
    });
  });

  it('shows loading state initially', async () => {
    vi.stubGlobal('fetch', createRequestsFetchMock());
    renderWithProviders(<ServiceRequestsListPage />);
    expect(screen.getByText(/carregando solicitações/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'SR-2026-DEMO01' })).toBeInTheDocument();
    });
  });

  it('filters by status via backend query', async () => {
    const fetchMock = createRequestsFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderWithProviders(<ServiceRequestsListPage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'SR-2026-DEMO01' })).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText('Status'), SERVICE_REQUEST_STATUSES.Draft);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('status=DRAFT'),
        expect.anything(),
      );
    });
  });

  it('filters by summary card selection', async () => {
    const fetchMock = createRequestsFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderWithProviders(<ServiceRequestsListPage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'SR-2026-DEMO01' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /filtrar solicitações pendentes/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('status=SUBMITTED'),
        expect.anything(),
      );
    });
    expect(screen.getByLabelText('Status')).toHaveValue(SERVICE_REQUEST_STATUSES.Submitted);
  });
});
