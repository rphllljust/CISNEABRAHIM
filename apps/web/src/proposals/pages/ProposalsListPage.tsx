import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { listProposals, ProposalsApiError } from '../api/proposals-api';
import { mapProposalErrorToMessage } from '../api/proposal-error-messages';
import { useProposalCapabilities } from '../hooks/useProposalCapabilities';
import type { Proposal } from '../types/proposal.types';
import { formatDateTime } from '../utils/proposal-labels';

const PAGE_SIZE = 20;

type ListState =
  | { phase: 'loading' }
  | { phase: 'denied' }
  | { phase: 'error'; message: string; retryable: boolean }
  | { phase: 'ready'; items: Proposal[]; offset: number; hasMore: boolean };

export function ProposalsListPage() {
  const { capabilities } = useProposalCapabilities();
  const [clientFilter, setClientFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [listState, setListState] = useState<ListState>({ phase: 'loading' });

  const loadPage = useCallback(
    async (offset: number, signal?: AbortSignal) => {
      setListState({ phase: 'loading' });
      try {
        const response = await listProposals(
          {
            limit: PAGE_SIZE,
            offset,
            clientId: clientFilter.trim() || undefined,
            unitId: unitFilter.trim() || undefined,
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
        if (error instanceof ProposalsApiError) {
          if (error.kind === 'denied') {
            setListState({ phase: 'denied' });
            return;
          }
          setListState({
            phase: 'error',
            message: mapProposalErrorToMessage(error.code, error.status),
            retryable: error.kind === 'network' || error.kind === 'unknown',
          });
          return;
        }
        setListState({
          phase: 'error',
          message: 'Não foi possível carregar as propostas.',
          retryable: true,
        });
      }
    },
    [clientFilter, unitFilter],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadPage(0, controller.signal);
    return () => controller.abort();
  }, [loadPage]);

  if (listState.phase === 'loading') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Propostas comerciais</h1>
        <p aria-busy="true" aria-live="polite">
          Carregando propostas…
        </p>
      </main>
    );
  }

  if (listState.phase === 'denied') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Propostas comerciais</h1>
        <p role="alert">Você não tem permissão para listar propostas.</p>
        <Link to="/app">Voltar ao início</Link>
      </main>
    );
  }

  if (listState.phase === 'error') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Propostas comerciais</h1>
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
  const hasActiveFilters = Boolean(clientFilter.trim() || unitFilter.trim());

  return (
    <main id="main-content" className="shell-page requests-page">
      <header className="requests-page__header">
        <h1>Propostas comerciais</h1>
        {capabilities.canCreate ? (
          <Link to="/app/proposals/new" className="button-link">
            Nova proposta
          </Link>
        ) : null}
      </header>

      <div className="requests-toolbar">
        <div className="form-field requests-filter">
          <label htmlFor="proposal-client-filter">Cliente (ID)</label>
          <input
            id="proposal-client-filter"
            type="search"
            value={clientFilter}
            onChange={(event) => setClientFilter(event.target.value)}
            placeholder="UUID do cliente"
          />
        </div>
        <div className="form-field requests-filter">
          <label htmlFor="proposal-unit-filter">Unidade</label>
          <input
            id="proposal-unit-filter"
            type="search"
            value={unitFilter}
            onChange={(event) => setUnitFilter(event.target.value)}
            placeholder="Filtrar por unidade"
          />
        </div>
        {hasActiveFilters ? (
          <button
            type="button"
            className="button-secondary"
            onClick={() => {
              setClientFilter('');
              setUnitFilter('');
            }}
          >
            Limpar filtros
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p role="status">Nenhuma proposta encontrada.</p>
      ) : (
        <table className="requests-table" aria-label="Lista de propostas comerciais">
          <thead>
            <tr>
              <th scope="col">Código</th>
              <th scope="col">Título</th>
              <th scope="col">Versão</th>
              <th scope="col">Unidade</th>
              <th scope="col">Atualizada em</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link to={`/app/proposals/${item.id}`}>{item.proposalCode}</Link>
                </td>
                <td>{item.title}</td>
                <td>{item.currentVersionNumber ?? '—'}</td>
                <td>{item.unitId}</td>
                <td>{formatDateTime(item.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="requests-pagination">
        <button
          type="button"
          disabled={offset === 0}
          onClick={() => void loadPage(Math.max(0, offset - PAGE_SIZE))}
        >
          Página anterior
        </button>
        <span aria-live="polite">Página {pageNumber}</span>
        <button
          type="button"
          disabled={!hasMore}
          onClick={() => void loadPage(offset + PAGE_SIZE)}
        >
          Próxima página
        </button>
      </div>
    </main>
  );
}
