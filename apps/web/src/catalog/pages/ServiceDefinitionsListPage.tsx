import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CatalogApiError, listServiceDefinitions } from '../api/service-catalog-api';
import { mapCatalogErrorToMessage } from '../api/catalog-error-messages';
import { ServiceDefinitionStatusBadge } from '../components/ServiceDefinitionStatusBadge';
import { useCatalogCapabilities } from '../hooks/useCatalogCapabilities';
import {
  CATALOG_LINEAGE_STATUSES,
  type CatalogLineageStatus,
  type ServiceDefinition,
} from '../types/service-catalog.types';

const PAGE_SIZE = 20;

type VersionFilter = '' | 'HAS_DRAFT' | 'HAS_PUBLISHED' | 'NO_PUBLISHED';

type ListState =
  | { phase: 'loading' }
  | { phase: 'denied' }
  | { phase: 'error'; message: string; retryable: boolean }
  | { phase: 'ready'; items: ServiceDefinition[]; offset: number; hasMore: boolean };

export function ServiceDefinitionsListPage() {
  const { capabilities } = useCatalogCapabilities();
  const [statusFilter, setStatusFilter] = useState<'' | CatalogLineageStatus>('');
  const [versionFilter, setVersionFilter] = useState<VersionFilter>('');
  const [search, setSearch] = useState('');
  const [listState, setListState] = useState<ListState>({ phase: 'loading' });

  const loadPage = useCallback(
    async (offset: number, signal?: AbortSignal) => {
      setListState({ phase: 'loading' });
      try {
        const response = await listServiceDefinitions(
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
        if (error instanceof CatalogApiError) {
          if (error.kind === 'denied') {
            setListState({ phase: 'denied' });
            return;
          }
          setListState({
            phase: 'error',
            message: mapCatalogErrorToMessage(error.code, error.status),
            retryable: error.kind === 'network' || error.kind === 'unknown',
          });
          return;
        }
        setListState({
          phase: 'error',
          message: 'Não foi possível carregar o catálogo.',
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

  const filteredItems = useMemo(() => {
    if (listState.phase !== 'ready') {
      return [];
    }
    const term = search.trim().toLowerCase();
    return listState.items.filter((item) => {
      if (term && !item.code.toLowerCase().includes(term)) {
        return false;
      }
      if (versionFilter === 'HAS_DRAFT' && item.currentDraftVersion === null) {
        return false;
      }
      if (versionFilter === 'HAS_PUBLISHED' && item.latestPublishedVersion === null) {
        return false;
      }
      if (versionFilter === 'NO_PUBLISHED' && item.latestPublishedVersion !== null) {
        return false;
      }
      return true;
    });
  }, [listState, search, versionFilter]);

  if (listState.phase === 'loading') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Catálogo de serviços</h1>
        <p aria-busy="true" aria-live="polite">
          Carregando definições…
        </p>
      </main>
    );
  }

  if (listState.phase === 'denied') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Catálogo de serviços</h1>
        <p role="alert">Você não tem permissão para listar o catálogo.</p>
        <Link to="/app">Voltar ao início</Link>
      </main>
    );
  }

  if (listState.phase === 'error') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Catálogo de serviços</h1>
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

  const { offset, hasMore } = listState;
  const pageNumber = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <main id="main-content" className="shell-page catalog-page">
      <header className="catalog-page__header">
        <h1>Catálogo de serviços</h1>
        {capabilities.canCreate ? (
          <Link to="/app/catalog/new" className="button-link">
            Nova definição
          </Link>
        ) : null}
      </header>

      <div className="catalog-toolbar">
        <div className="form-field catalog-filter">
          <label htmlFor="catalog-search">Buscar por código</label>
          <input
            id="catalog-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ex.: CNAE-7711000"
          />
          <p className="form-hint">A busca aplica-se à página atual retornada pelo servidor.</p>
        </div>
        <div className="form-field catalog-filter">
          <label htmlFor="catalog-status-filter">Status da definição</label>
          <select
            id="catalog-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as '' | CatalogLineageStatus)}
          >
            <option value="">Todos</option>
            <option value={CATALOG_LINEAGE_STATUSES.Active}>Ativos</option>
            <option value={CATALOG_LINEAGE_STATUSES.Inactive}>Inativos</option>
          </select>
        </div>
        <div className="form-field catalog-filter">
          <label htmlFor="catalog-version-filter">Versões</label>
          <select
            id="catalog-version-filter"
            value={versionFilter}
            onChange={(event) => setVersionFilter(event.target.value as VersionFilter)}
          >
            <option value="">Todas</option>
            <option value="HAS_DRAFT">Com rascunho</option>
            <option value="HAS_PUBLISHED">Com versão publicada</option>
            <option value="NO_PUBLISHED">Sem versão publicada</option>
          </select>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <p role="status">Nenhuma definição encontrada para os filtros selecionados.</p>
      ) : (
        <div className="catalog-table-wrap">
          <table className="catalog-table" aria-label="Lista de definições de serviço">
            <thead>
              <tr>
                <th scope="col">Código</th>
                <th scope="col">Status</th>
                <th scope="col">Versão publicada</th>
                <th scope="col">Rascunho</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((definition) => (
                <tr key={definition.id}>
                  <td>
                    <Link to={`/app/catalog/${definition.id}`}>{definition.code}</Link>
                  </td>
                  <td>
                    <ServiceDefinitionStatusBadge status={definition.status} />
                  </td>
                  <td>{definition.latestPublishedVersion ?? '—'}</td>
                  <td>{definition.currentDraftVersion ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <nav className="catalog-pagination" aria-label="Paginação do catálogo">
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
