import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceDefinitionsListPage } from './ServiceDefinitionsListPage';
import { renderWithProviders } from '../../test/render-with-providers';
import { tokenStore, resetTokenStoreForTests } from '../../auth/storage/token-store';
import { createCatalogFetchMock } from '../../test/catalog-fetch-mock';

describe('ServiceDefinitionsListPage integration', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    vi.unstubAllGlobals();
    tokenStore.setTokens('access-token', 'refresh-token');
  });

  it('loads catalog definitions and filters by code on the current page', async () => {
    vi.stubGlobal('fetch', createCatalogFetchMock());
    renderWithProviders(<ServiceDefinitionsListPage />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'LOCACAO-DEMO' })).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const search = screen.getByLabelText(/buscar por código/i);
    await user.type(search, 'UNKNOWN');

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/nenhuma definição encontrada/i);
    });
  });
});
