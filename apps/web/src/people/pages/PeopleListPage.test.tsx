import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PeopleListPage } from './PeopleListPage';
import { createPeopleFetchMock } from '../../test/people-fetch-mock';
import { renderWithProviders } from '../../test/render-with-providers';
import { tokenStore, resetTokenStoreForTests } from '../../auth/storage/token-store';

describe('PeopleListPage', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    tokenStore.setTokens('access-token', 'refresh-token');
    vi.unstubAllGlobals();
  });

  it('renders paginated list from backend', async () => {
    vi.stubGlobal('fetch', createPeopleFetchMock());
    renderWithProviders(<PeopleListPage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Demo' })).toBeInTheDocument();
    });
    expect(screen.getByRole('table', { name: /lista de pessoas/i })).toBeInTheDocument();
  });

  it('shows access denied when list is forbidden', async () => {
    vi.stubGlobal('fetch', createPeopleFetchMock({ personListAllowed: false }));
    renderWithProviders(<PeopleListPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/não tem permissão/i);
    });
  });

  it('filters by status via backend query', async () => {
    const fetchMock = createPeopleFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderWithProviders(<PeopleListPage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Demo' })).toBeInTheDocument();
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
