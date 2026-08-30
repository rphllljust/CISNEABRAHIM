import { useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { listServiceOrders, ServiceOrdersApiError, type ServiceOrderSummary } from '../api/service-orders-api';
import { mapServiceOrdersErrorToMessage } from '../api/service-orders-error-messages';
import { ServiceOrderStatusBadge } from '../components/ServiceOrderStatusBadge';
import {
  SERVICE_ORDER_ACTIVE_STATUS,
  SERVICE_ORDER_LIST_EVENTS,
  SERVICE_ORDER_LIST_FILTERS,
} from '../types/service-order-list.types';
import { SERVICE_ORDER_STATUSES } from '../types/service-order.types';
import {
  buildServiceOrderListSearchParams,
  EMPTY_SERVICE_ORDER_LIST_PARAMS,
  parseServiceOrderListParams,
  type ServiceOrderListParams,
} from '../utils/service-order-list-params';
import {
  formatClientLabel,
  formatDateTime,
  formatServiceOrderStatus,
} from '../utils/service-order-labels';
import { Button } from '../../ui/Button';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '../../ui/DataTable';
import {
  FilterCard,
  ModuleDeniedState,
  ModuleErrorState,
  ModuleLoadingState,
  ModulePage,
  ModulePageHeader,
  ModulePagination,
  ModuleTableLink,
  filterControlClass,
  filterLabelClass,
} from '../../ui/module-layout';

const PAGE_SIZE = 20;

type ListState =
  | { phase: 'loading' }
  | { phase: 'denied' }
  | { phase: 'error'; message: string; retryable: boolean }
  | { phase: 'ready'; items: ServiceOrderSummary[]; offset: number; hasMore: boolean };

function resolveFilterDescription(params: ServiceOrderListParams): string | null {
  if (params.filter === SERVICE_ORDER_LIST_FILTERS.Overdue) {
    return 'Mostrando ordens com prazo operacional vencido.';
  }
  if (params.filter === SERVICE_ORDER_LIST_FILTERS.ApproachingDue) {
    return 'Mostrando ordens com prazo operacional nos próximos 7 dias.';
  }
  if (params.from || params.to) {
    const from = params.from || '…';
    const to = params.to || '…';
    if (params.event === SERVICE_ORDER_LIST_EVENTS.Completed) {
      return `Período de conclusão: ${from} — ${to}.`;
    }
    return `Período de abertura: ${from} — ${to}.`;
  }
  return null;
}

export function ServiceOrdersListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseServiceOrderListParams(searchParams), [searchParams]);
  const offset = Number(searchParams.get('offset') ?? '0');
  const [listState, setListState] = useState<ListState>({ phase: 'loading' });

  const updateFilters = useCallback(
    (next: Partial<ServiceOrderListParams>) => {
      const merged = { ...filters, ...next };
      setSearchParams(buildServiceOrderListSearchParams(merged, 0), { replace: true });
    },
    [filters, setSearchParams],
  );

  const loadPage = useCallback(
    async (pageOffset: number, activeFilters: ServiceOrderListParams, signal?: AbortSignal) => {
      setListState({ phase: 'loading' });
      try {
        const response = await listServiceOrders(
          {
            limit: PAGE_SIZE,
            offset: pageOffset,
            q: activeFilters.q.trim() || undefined,
            status: activeFilters.status === '' ? undefined : activeFilters.status,
            filter: activeFilters.filter || undefined,
            unitId: activeFilters.unitId.trim() || undefined,
            clientId: activeFilters.clientId.trim() || undefined,
            from: activeFilters.from.trim() || undefined,
            to: activeFilters.to.trim() || undefined,
            event: activeFilters.event || undefined,
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
        if (error instanceof ServiceOrdersApiError) {
          if (error.kind === 'denied') {
            setListState({ phase: 'denied' });
            return;
          }
          setListState({
            phase: 'error',
            message: mapServiceOrdersErrorToMessage(error.code, error.status),
            retryable: error.kind === 'network' || error.kind === 'unknown',
          });
          return;
        }
        setListState({
          phase: 'error',
          message: 'Não foi possível carregar as ordens de serviço.',
          retryable: true,
        });
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadPage(offset, filters, controller.signal);
    return () => controller.abort();
  }, [filters, loadPage, offset]);

  const filterDescription = resolveFilterDescription(filters);
  const pageNumber = Math.floor(offset / PAGE_SIZE) + 1;
  const hasActiveFilters =
    Boolean(
      filters.q.trim() ||
        filters.status ||
        filters.filter ||
        filters.unitId.trim() ||
        filters.clientId.trim() ||
        filters.from.trim() ||
        filters.to.trim() ||
        filters.event,
    );

  if (listState.phase === 'loading') {
    return (
      <ModuleLoadingState
        title="Ordens de serviço"
        message="Carregando ordens de serviço…"
      />
    );
  }

  if (listState.phase === 'denied') {
    return (
      <ModuleDeniedState
        title="Ordens de serviço"
        message="Você não tem permissão para listar ordens de serviço."
      />
    );
  }

  if (listState.phase === 'error') {
    return (
      <ModuleErrorState
        title="Ordens de serviço"
        message={listState.message}
        retryable={listState.retryable}
        onRetry={() => void loadPage(offset, filters)}
      />
    );
  }

  const { items, hasMore } = listState;

  return (
    <ModulePage>
      <ModulePageHeader
        title="Ordens de serviço"
        description="Consulta operacional das OS no seu escopo autorizado."
      />

      {filterDescription ? (
        <p className="mb-6 text-sm text-gray-500">{filterDescription}</p>
      ) : null}

      <FilterCard>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={filterLabelClass} htmlFor="service-order-search">
              Busca
            </label>
            <input
              id="service-order-search"
              type="search"
              className={filterControlClass}
              value={filters.q}
              onChange={(event) => updateFilters({ q: event.target.value })}
              placeholder="Número, código interno ou descrição"
            />
          </div>
          <div>
            <label className={filterLabelClass} htmlFor="service-order-status-filter">
              Status
            </label>
            <select
              id="service-order-status-filter"
              className={filterControlClass}
              value={filters.status}
              onChange={(event) =>
                updateFilters({ status: event.target.value as ServiceOrderListParams['status'] })
              }
            >
              <option value="">Todos</option>
              <option value={SERVICE_ORDER_ACTIVE_STATUS}>Ativas (exceto canceladas)</option>
              {Object.values(SERVICE_ORDER_STATUSES).map((status) => (
                <option key={status} value={status}>
                  {formatServiceOrderStatus(status)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={filterLabelClass} htmlFor="service-order-filter">
              Alerta operacional
            </label>
            <select
              id="service-order-filter"
              className={filterControlClass}
              value={filters.filter}
              onChange={(event) =>
                updateFilters({ filter: event.target.value as ServiceOrderListParams['filter'] })
              }
            >
              <option value="">Nenhum</option>
              <option value={SERVICE_ORDER_LIST_FILTERS.Overdue}>Vencidas</option>
              <option value={SERVICE_ORDER_LIST_FILTERS.ApproachingDue}>Vencendo em breve</option>
            </select>
          </div>
          <div>
            <label className={filterLabelClass} htmlFor="service-order-unit-filter">
              Unidade
            </label>
            <input
              id="service-order-unit-filter"
              type="search"
              className={filterControlClass}
              value={filters.unitId}
              onChange={(event) => updateFilters({ unitId: event.target.value })}
              placeholder="Filtrar por unidade"
            />
          </div>
          <div>
            <label className={filterLabelClass} htmlFor="service-order-client-filter">
              Cliente (ID)
            </label>
            <input
              id="service-order-client-filter"
              type="search"
              className={filterControlClass}
              value={filters.clientId}
              onChange={(event) => updateFilters({ clientId: event.target.value })}
              placeholder="UUID do cliente"
            />
          </div>
          <div>
            <label className={filterLabelClass} htmlFor="service-order-from-filter">
              Período de
            </label>
            <input
              id="service-order-from-filter"
              type="date"
              className={filterControlClass}
              value={filters.from}
              onChange={(event) => updateFilters({ from: event.target.value })}
            />
          </div>
          <div>
            <label className={filterLabelClass} htmlFor="service-order-to-filter">
              Período até
            </label>
            <input
              id="service-order-to-filter"
              type="date"
              className={filterControlClass}
              value={filters.to}
              onChange={(event) => updateFilters({ to: event.target.value })}
            />
          </div>
        </div>
        {hasActiveFilters ? (
          <div className="mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setSearchParams(buildServiceOrderListSearchParams(EMPTY_SERVICE_ORDER_LIST_PARAMS))
              }
            >
              Limpar filtros
            </Button>
          </div>
        ) : null}
      </FilterCard>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500" role="status">
          Nenhuma ordem de serviço encontrada para os filtros selecionados.
        </p>
      ) : (
        <DataTable aria-label="Lista de ordens de serviço">
          <DataTableHead>
            <DataTableRow>
              <DataTableHeaderCell scope="col">Número</DataTableHeaderCell>
              <DataTableHeaderCell scope="col">Cliente</DataTableHeaderCell>
              <DataTableHeaderCell scope="col">Unidade</DataTableHeaderCell>
              <DataTableHeaderCell scope="col">Status</DataTableHeaderCell>
              <DataTableHeaderCell scope="col">Atualizada em</DataTableHeaderCell>
              <DataTableHeaderCell scope="col">Ações</DataTableHeaderCell>
            </DataTableRow>
          </DataTableHead>
          <DataTableBody>
            {items.map((item) => (
              <DataTableRow key={item.id}>
                <DataTableCell>
                  <ModuleTableLink to={`/app/service-orders/${item.id}/planning`}>
                    {item.orderNumber}
                  </ModuleTableLink>
                </DataTableCell>
                <DataTableCell>{formatClientLabel(item.clientSnapshot, item.clientId)}</DataTableCell>
                <DataTableCell>{item.unitId}</DataTableCell>
                <DataTableCell>
                  <ServiceOrderStatusBadge status={item.status} />
                </DataTableCell>
                <DataTableCell>{formatDateTime(item.updatedAt)}</DataTableCell>
                <DataTableCell>
                  <nav aria-label={`Ações da OS ${item.orderNumber}`} className="flex flex-wrap gap-3">
                    <ModuleTableLink to={`/app/service-orders/${item.id}/planning`}>
                      Planejamento
                    </ModuleTableLink>
                    <ModuleTableLink to={`/app/service-orders/${item.id}/execution`}>
                      Execução
                    </ModuleTableLink>
                    <ModuleTableLink to={`/app/service-orders/${item.id}/measurement`}>
                      Medição
                    </ModuleTableLink>
                  </nav>
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}

      <ModulePagination
        pageNumber={pageNumber}
        previousDisabled={offset === 0}
        nextDisabled={!hasMore}
        onPrevious={() =>
          setSearchParams(buildServiceOrderListSearchParams(filters, Math.max(0, offset - PAGE_SIZE)))
        }
        onNext={() => setSearchParams(buildServiceOrderListSearchParams(filters, offset + PAGE_SIZE))}
      />
    </ModulePage>
  );
}
