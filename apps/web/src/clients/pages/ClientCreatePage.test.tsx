import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientCreatePage } from './ClientCreatePage';
import { createClientsFetchMock } from '../../test/clients-fetch-mock';
import { renderWithProviders } from '../../test/render-with-providers';
import { tokenStore, resetTokenStoreForTests } from '../../auth/storage/token-store';

describe('ClientCreatePage', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    tokenStore.setTokens('access-token', 'refresh-token');
    vi.unstubAllGlobals();
  });

  it('shows validation errors for invalid create', async () => {
    vi.stubGlobal('fetch', createClientsFetchMock());
    const user = userEvent.setup();

    renderWithProviders(<ClientCreatePage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /novo cliente/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /cadastrar cliente/i }));

    await waitFor(() => {
      expect(screen.getByText(/razão social é obrigatória/i)).toBeInTheDocument();
    });
  });

  it('maps duplicate CNPJ to business message', async () => {
    vi.stubGlobal('fetch', createClientsFetchMock());
    const user = userEvent.setup();

    renderWithProviders(<ClientCreatePage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /novo cliente/i })).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/razão social/i), 'Outra LTDA');
    await user.type(screen.getByLabelText(/^cnpj$/i), '11.897.171/0001-81');
    await user.type(screen.getByLabelText(/nome do contato/i), 'Ops');
    await user.type(screen.getByLabelText(/^e-mail$/i), 'ops@demo.invalid');
    await user.click(screen.getByRole('button', { name: /cadastrar cliente/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/já existe um cliente cadastrado com este cnpj/i);
    });
  });

  it('shows permission denied when create capability is denied', async () => {
    vi.stubGlobal('fetch', createClientsFetchMock({ clientCreateAllowed: false }));
    renderWithProviders(<ClientCreatePage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/não tem permissão para cadastrar clientes/i);
    });
  });
});
