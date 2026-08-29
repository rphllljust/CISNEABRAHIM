import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { ClientsApiError, listClients } from '../api/clients-api';
import { mapClientErrorToMessage } from '../api/client-error-messages';
import { ClientStatusBadge } from '../components/ClientStatusBadge';
import { useClientCapabilities } from '../hooks/useClientCapabilities';
import { CLIENT_STATUSES, type Client, type ClientStatus } from '../types/client.types';
import { formatCnpjDisplay } from '../utils/format-cnpj';

const PAGE_SIZE = 20;

type ListState =
  | { phase: 'loading' }
  | { phase: 'denied' }
  | { phase: 'error'; message: string; retryable: boolean }
  | { phase: 'ready'; items: Client[]; offset: number; hasMore: boolean };

export function ClientsListPage() {
  const { capabilities } = useClientCapabilities();
  const [statusFilter, setStatusFilter] = useState<'' | ClientStatus>('');
  const [listState, setListState] = useState<ListState>({ phase: 'loading' });

  const loadPage = useCallback(
    async (offset: number, signal?: AbortSignal) => {
      setListState({ phase: 'loading' });
      try {
        const response = await listClients(
          {
            limit: PAGE_SIZE,
            offset,
            status: statusFilter || undefined,
          },
          signal,
        );
        setListState({
          phase: 'ready',
          items: response.items,
          offset: response.offset,
          hasMore: response.items.length === response.limit,
        });
      } catch (error) {
        if (error instanceof ClientsApiError) {
          if (error.kind === 'denied') {
            setListState({ phase: 'denied' });
            return;
          }
          setListState({
            phase: 'error',
            message: mapClientErrorToMessage(error.code, error.status),
            retryable: error.kind === 'network' || error.kind === 'unknown',
          });
          return;
        }
        setListState({
          phase: 'error',
          message: 'Não foi possível carregar os Clientes.',
          retryable: true,
        });
      }
    },
    [statusFilter],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadPage(0, controller.signal);
    return () => controller.abort();
  }, [loadPage]);

  if (listState.phase === 'loading') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Clientes</h1>
        <p aria-busy="true" aria-live="polite">
          Carregando Clientes…
        </p>
      </main>
    );
  }

  if (listState.phase === 'denied') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Clientes</h1>
        <p role="alert">Você não tem permissão para listar Clientes.</p>
        <p>
          <Link to="/app">Voltar ao início</Link>
        </p>
      </main>
    );
  }

  if (listState.phase === 'error') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Clientes</h1>
        <p className="form-error" role="alert">
          {listState.message}
        </p>
        {listState.retryable ? (
          <button type="button" onClick={() => void loadPage(0)}>
            Tentar novamente
          </button>
        ) : null}
      </main>
    );
  }

  const { items, offset, hasMore } = listState;
  const pageNumber = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <main id="main-content" className="shell-page clients-page">
      <header className="clients-page__header">
        <h1>Clientes</h1>
        {capabilities.canCreate ? (
          <Link to="/app/clients/new" className="button-link">
            Novo Cliente
          </Link>
        ) : null}
      </header>

      <div className="clients-toolbar">
        <div className="form-field clients-filter">
          <label htmlFor="client-status-filter">Status</label>
          <select
            id="client-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as '' | ClientStatus)}
          >
            <option value="">Todos</option>
            <option value={CLIENT_STATUSES.Active}>Ativos</option>
            <option value={CLIENT_STATUSES.Inactive}>Inativos</option>
          </select>
        </div>
      </div>

      {items.length === 0 ? (
        <p role="status">Nenhum Cliente encontrado para os filtros selecionados.</p>
      ) : (
        <div className="clients-table-wrap">
          <table className="clients-table" aria-label="Lista de Clientes">
            <thead>
              <tr>
                <th scope="col">Razão social</th>
                <th scope="col">CNPJ</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((client) => (
                <tr key={client.id}>
                  <td>
                    <Link to={`/app/clients/${client.id}`}>{client.legalName}</Link>
                  </td>
                  <td>{formatCnpjDisplay(client.taxId)}</td>
                  <td>
                    <ClientStatusBadge status={client.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <nav className="clients-pagination" aria-label="Paginação de Clientes">
        <button
          type="button"
          className="button-secondary"
          disabled={offset === 0}
          onClick={() => void loadPage(Math.max(0, offset - PAGE_SIZE))}
        >
          Anterior
        </button>
        <span aria-live="polite">Página {pageNumber}</span>
        <button
          type="button"
          className="button-secondary"
          disabled={!hasMore}
          onClick={() => void loadPage(offset + PAGE_SIZE)}
        >
          Próxima
        </button>
      </nav>
    </main>
  );
}
