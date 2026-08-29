import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientsListPage } from './ClientsListPage';
import { createClientsFetchMock } from '../../test/clients-fetch-mock';
import { renderWithProviders } from '../../test/render-with-providers';
import { tokenStore, resetTokenStoreForTests } from '../../auth/storage/token-store';

describe('ClientsListPage', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    tokenStore.setTokens('access-token', 'refresh-token');
    vi.unstubAllGlobals();
  });

  it('renders paginated list from backend', async () => {
    vi.stubGlobal('fetch', createClientsFetchMock());
    renderWithProviders(<ClientsListPage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Cliente Demo LTDA' })).toBeInTheDocument();
    });
    expect(screen.getByRole('table', { name: /lista de clientes/i })).toBeInTheDocument();
  });

  it('shows access denied when list is forbidden', async () => {
    vi.stubGlobal('fetch', createClientsFetchMock({ clientListAllowed: false }));
    renderWithProviders(<ClientsListPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/não tem permissão/i);
    });
  });

  it('filters by status via backend query', async () => {
    const fetchMock = createClientsFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<ClientsListPage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Cliente Demo LTDA' })).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'INACTIVE');

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('status=INACTIVE'),
        expect.anything(),
      );
    });
  });
});
