import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { mapAssetErrorToMessage } from '../api/asset-error-messages';
import { AssetsApiError, listPhysicalAssets } from '../api/physical-assets-api';
import { AssetAllocationStatusBadge } from '../components/AssetAllocationStatusBadge';
import { AssetLifecycleStatusBadge } from '../components/AssetLifecycleStatusBadge';
import { useAssetCapabilities, useAssetResourceTypes } from '../hooks/useAssetCapabilities';
import {
  ASSET_ALLOCATION_STATUSES,
  ASSET_LIFECYCLE_STATUSES,
  type AssetAllocationStatus,
  type AssetLifecycleStatus,
  type PhysicalAsset,
} from '../types/physical-asset.types';
import { filterAssetsBySearch } from '../utils/asset-form-state';

const PAGE_SIZE = 20;

type ListState =
  | { phase: 'loading' }
  | { phase: 'denied' }
  | { phase: 'error'; message: string; retryable: boolean }
  | { phase: 'ready'; items: PhysicalAsset[]; offset: number; hasMore: boolean };

export function PhysicalAssetsListPage() {
  const { capabilities } = useAssetCapabilities();
  const { resourceTypes } = useAssetResourceTypes();
  const [lifecycleFilter, setLifecycleFilter] = useState<'' | AssetLifecycleStatus>('');
  const [allocationFilter, setAllocationFilter] = useState<'' | AssetAllocationStatus>('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [listState, setListState] = useState<ListState>({ phase: 'loading' });

  const loadPage = useCallback(
    async (offset: number, signal?: AbortSignal) => {
      setListState({ phase: 'loading' });
      try {
        const response = await listPhysicalAssets(
          {
            limit: PAGE_SIZE,
            offset,
            lifecycleStatus: lifecycleFilter || undefined,
            allocationStatus: allocationFilter || undefined,
            resourceTypeId: resourceTypeFilter || undefined,
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
        if (error instanceof AssetsApiError) {
          if (error.kind === 'denied') {
            setListState({ phase: 'denied' });
            return;
          }
          setListState({
            phase: 'error',
            message: mapAssetErrorToMessage(error.code, error.status),
            retryable: error.kind === 'network' || error.kind === 'unknown',
          });
          return;
        }
        setListState({
          phase: 'error',
          message: 'Não foi possível carregar os ativos.',
          retryable: true,
        });
      }
    },
    [allocationFilter, lifecycleFilter, resourceTypeFilter],
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
    return filterAssetsBySearch(listState.items, search);
  }, [listState, search]);

  if (listState.phase === 'loading') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Ativos físicos</h1>
        <p aria-busy="true" aria-live="polite">
          Carregando ativos…
        </p>
      </main>
    );
  }

  if (listState.phase === 'denied') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Ativos físicos</h1>
        <p role="alert">Você não tem permissão para listar ativos físicos.</p>
        <Link to="/app">Voltar ao início</Link>
      </main>
    );
  }

  if (listState.phase === 'error') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Ativos físicos</h1>
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
    <main id="main-content" className="shell-page assets-page">
      <header className="assets-page__header">
        <h1>Ativos físicos</h1>
        {capabilities.canCreate ? (
          <Link to="/app/assets/new" className="button-link">
            Novo ativo
          </Link>
        ) : null}
      </header>

      <div className="assets-toolbar">
        <div className="form-field assets-filter">
          <label htmlFor="asset-search">Buscar</label>
          <input
            id="asset-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Código, nome ou placa"
          />
        </div>
        <div className="form-field assets-filter">
          <label htmlFor="asset-lifecycle-filter">Cadastro</label>
          <select
            id="asset-lifecycle-filter"
            value={lifecycleFilter}
            onChange={(event) =>
              setLifecycleFilter(event.target.value as '' | AssetLifecycleStatus)
            }
          >
            <option value="">Todos</option>
            <option value={ASSET_LIFECYCLE_STATUSES.Active}>Ativos</option>
            <option value={ASSET_LIFECYCLE_STATUSES.Inactive}>Inativos</option>
          </select>
        </div>
        <div className="form-field assets-filter">
          <label htmlFor="asset-allocation-filter">Alocação</label>
          <select
            id="asset-allocation-filter"
            value={allocationFilter}
            onChange={(event) =>
              setAllocationFilter(event.target.value as '' | AssetAllocationStatus)
            }
          >
            <option value="">Todas</option>
            <option value={ASSET_ALLOCATION_STATUSES.Available}>Disponíveis</option>
            <option value={ASSET_ALLOCATION_STATUSES.Allocated}>Alocados</option>
          </select>
        </div>
        <div className="form-field assets-filter">
          <label htmlFor="asset-type-filter">Tipo de recurso</label>
          <select
            id="asset-type-filter"
            value={resourceTypeFilter}
            onChange={(event) => setResourceTypeFilter(event.target.value)}
          >
            <option value="">Todos</option>
            {resourceTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <p role="status">Nenhum ativo encontrado para os filtros selecionados.</p>
      ) : (
        <div className="assets-table-wrap">
          <table className="assets-table" aria-label="Lista de ativos físicos">
            <thead>
              <tr>
                <th scope="col">Código</th>
                <th scope="col">Nome</th>
                <th scope="col">Tipo</th>
                <th scope="col">Cadastro</th>
                <th scope="col">Alocação</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((asset) => (
                <tr key={asset.id}>
                  <td>
                    <Link to={`/app/assets/${asset.id}`}>{asset.assetCode}</Link>
                  </td>
                  <td>{asset.name}</td>
                  <td>{asset.resourceTypeCode}</td>
                  <td>
                    <AssetLifecycleStatusBadge status={asset.lifecycleStatus} />
                  </td>
                  <td>
                    <AssetAllocationStatusBadge status={asset.allocationStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <nav className="assets-pagination" aria-label="Paginação de ativos">
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
