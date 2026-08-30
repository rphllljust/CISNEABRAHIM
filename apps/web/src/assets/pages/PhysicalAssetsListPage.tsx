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
import {
  FilterCard,
  ModuleDeniedState,
  ModuleErrorState,
  ModuleLoadingState,
  ModulePage,
  ModulePageHeader,
  ModulePagination,
  ModulePrimaryLink,
  ModuleTableCard,
  ModuleTableLink,
  filterControlClass,
  filterLabelClass,
  moduleTableCellClass,
  moduleTableClass,
  moduleTableHeadClass,
  moduleTableHeaderCellClass,
  moduleTableRowClass,
} from '../../ui/module-layout';

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
    return <ModuleLoadingState title="Ativos físicos" message="Carregando ativos…" />;
  }

  if (listState.phase === 'denied') {
    return (
      <ModuleDeniedState
        title="Ativos físicos"
        message="Você não tem permissão para listar ativos físicos."
      />
    );
  }

  if (listState.phase === 'error') {
    return (
      <ModuleErrorState
        title="Ativos físicos"
        message={listState.message}
        retryable={listState.retryable}
        onRetry={() => void loadPage(0)}
      />
    );
  }

  const { offset, hasMore } = listState;
  const pageNumber = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <ModulePage>
      <ModulePageHeader
        title="Ativos físicos"
        action={
          capabilities.canCreate ? (
            <ModulePrimaryLink to="/app/assets/new">Novo ativo</ModulePrimaryLink>
          ) : null
        }
      />

      <FilterCard>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className={filterLabelClass} htmlFor="asset-search">
              Buscar
            </label>
            <input
              id="asset-search"
              type="search"
              className={filterControlClass}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Código, nome ou placa"
            />
          </div>
          <div>
            <label className={filterLabelClass} htmlFor="asset-lifecycle-filter">
              Cadastro
            </label>
            <select
              id="asset-lifecycle-filter"
              className={filterControlClass}
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
          <div>
            <label className={filterLabelClass} htmlFor="asset-allocation-filter">
              Alocação
            </label>
            <select
              id="asset-allocation-filter"
              className={filterControlClass}
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
          <div>
            <label className={filterLabelClass} htmlFor="asset-type-filter">
              Tipo de recurso
            </label>
            <select
              id="asset-type-filter"
              className={filterControlClass}
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
      </FilterCard>

      {filteredItems.length === 0 ? (
        <p className="text-sm text-gray-500" role="status">
          Nenhum ativo encontrado para os filtros selecionados.
        </p>
      ) : (
        <ModuleTableCard>
          <table className={moduleTableClass} aria-label="Lista de ativos físicos">
            <thead className={moduleTableHeadClass}>
              <tr>
                <th scope="col" className={moduleTableHeaderCellClass}>
                  Código
                </th>
                <th scope="col" className={moduleTableHeaderCellClass}>
                  Nome
                </th>
                <th scope="col" className={moduleTableHeaderCellClass}>
                  Tipo
                </th>
                <th scope="col" className={moduleTableHeaderCellClass}>
                  Cadastro
                </th>
                <th scope="col" className={moduleTableHeaderCellClass}>
                  Alocação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((asset) => (
                <tr key={asset.id} className={moduleTableRowClass}>
                  <td className={moduleTableCellClass}>
                    <ModuleTableLink to={`/app/assets/${asset.id}`}>
                      {asset.assetCode}
                    </ModuleTableLink>
                  </td>
                  <td className={moduleTableCellClass}>{asset.name}</td>
                  <td className={moduleTableCellClass}>{asset.resourceTypeCode}</td>
                  <td className={moduleTableCellClass}>
                    <AssetLifecycleStatusBadge status={asset.lifecycleStatus} />
                  </td>
                  <td className={moduleTableCellClass}>
                    <AssetAllocationStatusBadge status={asset.allocationStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ModuleTableCard>
      )}

      <ModulePagination
        pageNumber={pageNumber}
        previousDisabled={offset === 0}
        nextDisabled={!hasMore}
        onPrevious={() => void loadPage(Math.max(0, offset - PAGE_SIZE))}
        onNext={() => void loadPage(offset + PAGE_SIZE)}
      />
    </ModulePage>
  );
}
