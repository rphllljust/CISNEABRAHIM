import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PersonCreatePage } from './PersonCreatePage';
import { createPeopleFetchMock } from '../../test/people-fetch-mock';
import { renderWithProviders } from '../../test/render-with-providers';
import { tokenStore, resetTokenStoreForTests } from '../../auth/storage/token-store';

describe('PersonCreatePage', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    tokenStore.setTokens('access-token', 'refresh-token');
    vi.unstubAllGlobals();
  });

  it('shows validation error for empty legal name', async () => {
    vi.stubGlobal('fetch', createPeopleFetchMock());
    const user = userEvent.setup();

    renderWithProviders(<PersonCreatePage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /nova pessoa/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /cadastrar/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/informe o nome legal/i);
    });
  });

  it('shows permission denied when create capability is denied', async () => {
    vi.stubGlobal('fetch', createPeopleFetchMock({ personCreateAllowed: false }));
    renderWithProviders(<PersonCreatePage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/não tem permissão para cadastrar pessoas/i);
    });
  });
});
