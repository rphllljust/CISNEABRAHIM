import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { resetTokenStoreForTests } from '../auth/storage/token-store';
import { createAssetsFetchMock } from '../test/assets-fetch-mock';

describe('physical assets administrative flow e2e (frontend)', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    sessionStorage.clear();
    vi.unstubAllGlobals();
    window.history.pushState({}, '', '/login');
  });

  async function login(user: ReturnType<typeof userEvent.setup>) {
    await user.type(await screen.findByLabelText(/login/i), 'user@test');
    await user.type(screen.getByLabelText(/password/i), 'Password1!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /painel operacional/i })).toBeInTheDocument();
    });
  }

  it('supports list, detail, edit conflict messaging and lifecycle actions', async () => {
    vi.stubGlobal('fetch', createAssetsFetchMock());
    render(<App />);
    const user = userEvent.setup();
    await login(user);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /ativos físicos/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('link', { name: /ativos físicos/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /ativos físicos/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'TRK-DEMO' })).toBeInTheDocument();
    expect(screen.getByLabelText(/status de cadastro: ativo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status de alocação: disponível/i)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'TRK-DEMO' }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'TRK-DEMO' })).toBeInTheDocument();
    });
    expect(screen.getByText(/cadastro \(ativo\/inativo\) e alocação operacional são independentes/i)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /^editar$/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /editar TRK-DEMO/i })).toBeInTheDocument();
    });

    vi.stubGlobal('fetch', createAssetsFetchMock({ versionConflictOnUpdate: true }));
    await user.clear(screen.getByLabelText(/nome \/ descrição/i));
    await user.type(screen.getByLabelText(/nome \/ descrição/i), 'Nome atualizado');
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /recarregar dados atuais/i })).toBeInTheDocument();
    });
  }, 20000);

  it('hides assets navigation when list access is denied', async () => {
    vi.stubGlobal('fetch', createAssetsFetchMock({ assetListAllowed: false }));
    render(<App />);
    const user = userEvent.setup();
    await login(user);

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /ativos físicos/i })).not.toBeInTheDocument();
    });
  });
});
