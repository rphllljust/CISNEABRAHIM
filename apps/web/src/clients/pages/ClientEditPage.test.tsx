import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientEditPage } from './ClientEditPage';
import { createClientsFetchMock } from '../../test/clients-fetch-mock';
import { requestUrl } from '../../test/request-url';
import { renderWithProviders } from '../../test/render-with-providers';
import { tokenStore, resetTokenStoreForTests } from '../../auth/storage/token-store';
import { VERSION_CONFLICT_MESSAGE } from '../api/client-error-messages';

describe('ClientEditPage', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    tokenStore.setTokens('access-token', 'refresh-token');
    vi.unstubAllGlobals();
  });

  it('shows version conflict without silent overwrite', async () => {
    const fetchMock = createClientsFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    renderWithProviders(
      <Routes>
        <Route path="/app/clients/:clientId/edit" element={<ClientEditPage />} />
      </Routes>,
      { router: { initialEntries: ['/app/clients/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/edit'] } },
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/razão social/i)).toHaveValue('Cliente Demo LTDA');
    });

    const originalFetch = fetchMock.getMockImplementation();
    fetchMock.mockImplementation(async (input, init) => {
      const url = requestUrl(input);
      if (url.includes('/api/v1/clients/aaaaaaaa') && init?.method === 'PATCH') {
        return {
          ok: false,
          status: 409,
          json: async () => ({ error: { code: 'CLIENT_VERSION_CONFLICT', message: 'conflict' } }),
        } as Response;
      }
      return originalFetch?.(input, init) as Promise<Response>;
    });

    await user.clear(screen.getByLabelText(/razão social/i));
    await user.type(screen.getByLabelText(/razão social/i), 'Alterado');
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(VERSION_CONFLICT_MESSAGE);
    });
  });
});
