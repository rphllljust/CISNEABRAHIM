import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { resetTokenStoreForTests } from '../auth/storage/token-store';
import { createCatalogFetchMock } from '../test/catalog-fetch-mock';

describe('catalog administrative flow e2e (frontend)', () => {
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

  it('supports list, detail, versioning, publish and published immutability messaging', async () => {
    vi.stubGlobal('fetch', createCatalogFetchMock());
    render(<App />);
    const user = userEvent.setup();
    await login(user);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /catálogo de serviços/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('link', { name: /catálogo de serviços/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /catálogo de serviços/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'LOCACAO-DEMO' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'LOCACAO-DEMO' }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'LOCACAO-DEMO' })).toBeInTheDocument();
    });
    expect(screen.getByText(/versões publicadas não são editáveis/i)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /criar nova versão/i }));
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /criar nova versão/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /criar rascunho da nova versão/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /LOCACAO-DEMO — v2/i })).toBeInTheDocument();
    });
    expect(screen.getAllByLabelText(/status da versão: rascunho/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('link', { name: /voltar à definição/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^publicar$/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /^publicar$/i }));
    await user.click(screen.getByRole('button', { name: /confirmar publicação/i }));

    await waitFor(() => {
      expect(screen.getAllByLabelText(/status da versão: publicada/i).length).toBeGreaterThan(0);
    });
  }, 20000);

  it('hides catalog navigation when list access is denied', async () => {
    vi.stubGlobal('fetch', createCatalogFetchMock({ catalogListAllowed: false }));
    render(<App />);
    const user = userEvent.setup();
    await login(user);

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /catálogo de serviços/i })).not.toBeInTheDocument();
    });
  });
});
