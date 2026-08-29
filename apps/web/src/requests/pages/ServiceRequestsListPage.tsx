import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { listServiceRequests, ServiceRequestsApiError } from '../api/service-requests-api';
import { mapRequestErrorToMessage } from '../api/request-error-messages';
import { ServiceRequestStatusBadge } from '../components/ServiceRequestStatusBadge';
import { useServiceRequestCapabilities } from '../hooks/useServiceRequestCapabilities';
import {
  SERVICE_REQUEST_STATUSES,
  type ServiceRequest,
  type ServiceRequestStatus,
} from '../types/service-request.types';
import {
  formatDateTime,
  formatServiceRequestOrigin,
  formatServiceRequestStatus,
} from '../utils/service-request-labels';

const PAGE_SIZE = 20;

type ListState =
  | { phase: 'loading' }
  | { phase: 'denied' }
  | { phase: 'error'; message: string; retryable: boolean }
  | { phase: 'ready'; items: ServiceRequest[]; offset: number; hasMore: boolean };

export function ServiceRequestsListPage() {
  const { capabilities } = useServiceRequestCapabilities();
  const [statusFilter, setStatusFilter] = useState<'' | ServiceRequestStatus>('');
  const [unitFilter, setUnitFilter] = useState('');
  const [listState, setListState] = useState<ListState>({ phase: 'loading' });

  const loadPage = useCallback(
    async (offset: number, signal?: AbortSignal) => {
      setListState({ phase: 'loading' });
      try {
        const response = await listServiceRequests(
          {
            limit: PAGE_SIZE,
            offset,
            status: statusFilter || undefined,
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
        if (error instanceof ServiceRequestsApiError) {
          if (error.kind === 'denied') {
            setListState({ phase: 'denied' });
            return;
          }
          setListState({
            phase: 'error',
            message: mapRequestErrorToMessage(error.code, error.status),
            retryable: error.kind === 'network' || error.kind === 'unknown',
          });
          return;
        }
        setListState({
          phase: 'error',
          message: 'Não foi possível carregar as solicitações.',
          retryable: true,
        });
      }
    },
    [statusFilter, unitFilter],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadPage(0, controller.signal);
    return () => controller.abort();
  }, [loadPage]);

  if (listState.phase === 'loading') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Solicitações de serviço</h1>
        <p aria-busy="true" aria-live="polite">
          Carregando solicitações…
        </p>
      </main>
    );
  }

  if (listState.phase === 'denied') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Solicitações de serviço</h1>
        <p role="alert">Você não tem permissão para listar solicitações.</p>
        <Link to="/app">Voltar ao início</Link>
      </main>
    );
  }

  if (listState.phase === 'error') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Solicitações de serviço</h1>
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
    <main id="main-content" className="shell-page requests-page">
      <header className="requests-page__header">
        <h1>Solicitações de serviço</h1>
        {capabilities.canCreate ? (
          <Link to="/app/requests/new" className="button-link">
            Nova solicitação
          </Link>
        ) : null}
      </header>

      <div className="requests-toolbar">
        <div className="form-field requests-filter">
          <label htmlFor="request-status-filter">Status</label>
          <select
            id="request-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as '' | ServiceRequestStatus)
            }
          >
            <option value="">Todos</option>
            {Object.values(SERVICE_REQUEST_STATUSES).map((status) => (
              <option key={status} value={status}>
                {formatServiceRequestStatus(status)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field requests-filter">
          <label htmlFor="request-unit-filter">Unidade</label>
          <input
            id="request-unit-filter"
            type="search"
            value={unitFilter}
            onChange={(event) => setUnitFilter(event.target.value)}
            placeholder="Filtrar por unidade"
          />
        </div>
      </div>

      {items.length === 0 ? (
        <p role="status">Nenhuma solicitação encontrada.</p>
      ) : (
        <table className="requests-table" aria-label="Lista de solicitações de serviço">
          <thead>
            <tr>
              <th scope="col">Código</th>
              <th scope="col">Origem</th>
              <th scope="col">Status</th>
              <th scope="col">Unidade</th>
              <th scope="col">Atualizada em</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link to={`/app/requests/${item.id}`}>{item.requestCode}</Link>
                </td>
                <td>{formatServiceRequestOrigin(item.originSource)}</td>
                <td>
                  <ServiceRequestStatusBadge status={item.status} />
                </td>
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
