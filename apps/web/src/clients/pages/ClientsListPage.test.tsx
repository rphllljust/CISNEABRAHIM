import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientsListPage } from './ClientsListPage';
import { createClientsFetchMock } from '../../test/clients-fetch-mock';
import { renderWithProviders } from '../../test/render-with-providers';
import { resetTokenStoreForTests, tokenStore } from '../../auth/storage/token-store';

describe('ClientsListPage (central de clientes)', () => {
  beforeEach(() => {
    resetTokenStoreForTests();
    tokenStore.setTokens('access-token', 'refresh-token');
    vi.unstubAllGlobals();
  });

  it('renders the compact enterprise list: search, KPIs, table and real actions', async () => {
    vi.stubGlobal('fetch', createClientsFetchMock());
    const user = userEvent.setup();
    renderWithProviders(<ClientsListPage />);

    expect(
      await screen.findByText('Gerencie clientes, requisitos comerciais e vínculos operacionais.'),
    ).toBeInTheDocument();

    // Toolbar de busca própria + filtros (sem o card antigo de Status).
    expect(screen.getByLabelText('Buscar cliente')).toHaveAttribute(
      'placeholder',
      'Buscar por razão social ou CNPJ',
    );
    expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Requisito de PO' })).toBeInTheDocument();
    expect(screen.queryByText('Status', { selector: 'label' })).toBeTruthy();

    // Tabela com CLIENTE/CNPJ/Requisito/Status/Ações + nome fantasia.
    const table = await screen.findByRole('table', { name: 'Lista de Clientes' });

    // KPIs discretos reais.
    const kpis = screen.getByTestId('clients-kpis');
    for (const label of ['Total', 'Ativos', 'Inativos', 'Exigem PO']) {
      expect(within(kpis).getByText(label)).toBeInTheDocument();
    }

    expect(within(table).getByText('Requisito comercial')).toBeInTheDocument();
    const links = within(table).getAllByRole('link', { name: 'Cliente Demo LTDA' });
    expect(links.length).toBeGreaterThan(0);
    expect(within(table).getByText('Demo')).toBeInTheDocument();
    expect(within(table).getByText('PO não obrigatório')).toBeInTheDocument();

    // Ações reais por linha via menu ⋯ (Ver/Editar).
    const actionsButtons = await screen.findAllByRole('button', { name: /Ações do cliente/ });
    expect(actionsButtons.length).toBeGreaterThan(0);
    await user.click(actionsButtons[0] as HTMLElement);
    expect(screen.getByRole('menuitem', { name: 'Ver cliente' })).toHaveAttribute(
      'href',
      '/app/clients/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveAttribute(
      'href',
      '/app/clients/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/edit',
    );

    expect(screen.getByText(/Mostrando 1–1 de 1 clientes/)).toBeInTheDocument();
  });

  it('filters by status via backend query (server-side)', async () => {
    const fetchMock = createClientsFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderWithProviders(<ClientsListPage />);

    await screen.findByRole('table', { name: 'Lista de Clientes' });

    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'INACTIVE');

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('status=INACTIVE'),
        expect.anything(),
      );
    });
  });

  it('debounces the dedicated client search into a server-side query', async () => {
    const fetchMock = createClientsFetchMock();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderWithProviders(<ClientsListPage />);

    await screen.findByRole('table', { name: 'Lista de Clientes' });

    const search = screen.getByLabelText('Buscar cliente');
    await user.type(search, 'Demo');

    await waitFor(
      () => {
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('search=Demo'),
          expect.anything(),
        );
      },
      { timeout: 1500 },
    );
  });

  it('shows denied state when the list endpoint is forbidden', async () => {
    vi.stubGlobal('fetch', createClientsFetchMock({ clientListAllowed: false }));
    renderWithProviders(<ClientsListPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/não tem permissão para listar Clientes/i);
  });
});
