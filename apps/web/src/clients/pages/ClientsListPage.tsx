import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClientsApiError, listClients } from '../api/clients-api';
import { mapClientErrorToMessage } from '../api/client-error-messages';
import { ClientStatusBadge } from '../components/ClientStatusBadge';
import { useClientCapabilities } from '../hooks/useClientCapabilities';
import {
  CLIENT_STATUSES,
  PURCHASE_ORDER_REQUIREMENTS,
  type Client,
  type ClientStatus,
  type PurchaseOrderRequirement,
} from '../types/client.types';
import { formatCnpjDisplay } from '../utils/format-cnpj';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { ModuleDeniedState } from '../../ui/module-layout';
import { Select } from '../../ui/Select';
import { Skeleton } from '../../ui/Skeleton';
import { StatusBadge } from '../../ui/StatusBadge';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

type ClientsFilters = {
  search: string;
  status: '' | ClientStatus;
  purchaseOrderRequirement: '' | PurchaseOrderRequirement;
};

type ClientSummary = { total: number; active: number; inactive: number; purchaseOrderRequired: number };

type ListState =
  | { phase: 'loading' }
  | { phase: 'denied' }
  | { phase: 'error'; message: string; retryable: boolean }
  | { phase: 'ready'; items: Client[]; offset: number; total: number; summary: ClientSummary };

function purchaseOrderLabel(requirement: PurchaseOrderRequirement): string {
  return requirement === PURCHASE_ORDER_REQUIREMENTS.NotRequired ? 'PO não obrigatório' : 'PO obrigatório';
}

function purchaseOrderRequirementOptions(): Array<{ value: '' | PurchaseOrderRequirement; label: string }> {
  return [
    { value: '', label: 'Todos' },
    { value: PURCHASE_ORDER_REQUIREMENTS.NotRequired, label: 'PO não obrigatório' },
    { value: PURCHASE_ORDER_REQUIREMENTS.BeforeExecution, label: 'PO obrigatório (antes da execução)' },
    { value: PURCHASE_ORDER_REQUIREMENTS.BeforeBilling, label: 'PO obrigatório (antes do faturamento)' },
  ];
}

function CompactKpis({ summary }: { summary: ClientSummary }) {
  const kpis = [
    { label: 'Total', value: summary.total },
    { label: 'Ativos', value: summary.active },
    { label: 'Inativos', value: summary.inactive },
    { label: 'Exigem PO', value: summary.purchaseOrderRequired },
  ];
  return (
    <dl
      data-testid="clients-kpis"
      aria-label="Resumo de clientes"
      className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-gray-900/5"
    >
      {kpis.map((kpi, index) => (
        <div key={kpi.label} className="flex items-center gap-1.5">
          {index > 0 ? (
            <span aria-hidden="true" className="mr-3 text-gray-300">
              |
            </span>
          ) : null}
          <dt className="text-gray-500">{kpi.label}</dt>
          <dd className="font-semibold tabular-nums text-gray-900">{kpi.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function RowActions({
  clientId,
  canRead,
  canUpdate,
}: {
  clientId: string;
  canRead: boolean;
  canUpdate: boolean;
}) {
  const [open, setOpen] = useState(false);
  const actions = [
    canRead ? { label: 'Ver cliente', to: `/app/clients/${clientId}` } : null,
    canUpdate ? { label: 'Editar', to: `/app/clients/${clientId}/edit` } : null,
  ].filter((action): action is { label: string; to: string } => action !== null);

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="relative text-right">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Ações do cliente ${clientId}`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">⋯</span>
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Fechar menu de ações"
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <ul
            role="menu"
            className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-md bg-white py-1 shadow-[var(--shadow-dialog)] ring-1 ring-gray-900/10"
          >
            {actions.map((action) => (
              <li key={action.to}>
                <Link
                  role="menuitem"
                  to={action.to}
                  className="block px-3 py-2 text-sm text-gray-700 no-underline hover:bg-gray-50"
                  onClick={() => setOpen(false)}
                >
                  {action.label}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

const EMPTY_FILTERS: ClientsFilters = { search: '', status: '', purchaseOrderRequirement: '' };

export function ClientsListPage() {
  const { capabilities } = useClientCapabilities();
  const [filters, setFilters] = useState<ClientsFilters>(EMPTY_FILTERS);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [listState, setListState] = useState<ListState>({ phase: 'loading' });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(filters.search.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  const loadPage = useCallback(async (offset: number, applied: ClientsFilters, signal?: AbortSignal) => {
    setListState({ phase: 'loading' });
    try {
      const response = await listClients(
        {
          limit: PAGE_SIZE,
          offset,
          status: applied.status || undefined,
          search: debouncedQuery || undefined,
          purchaseOrderRequirement: applied.purchaseOrderRequirement || undefined,
        },
        signal,
      );
      if (signal?.aborted) {
        return;
      }
      setListState({
        phase: 'ready',
        items: response.items,
        offset: response.offset,
        total: response.total,
        summary: response.summary,
      });
    } catch (error) {
      if (signal?.aborted) {
        return;
      }
      if (error instanceof ClientsApiError) {
        if (error.status === 401 || error.kind === 'denied') {
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
      setListState({ phase: 'error', message: 'Não foi possível carregar os Clientes.', retryable: true });
    }
  }, [debouncedQuery]);

  useEffect(() => {
    const controller = new AbortController();
    void loadPage(0, filters, controller.signal);
    return () => controller.abort();
  }, [debouncedQuery, filters.status, filters.purchaseOrderRequirement, loadPage]);

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
  }

  if (listState.phase === 'denied') {
    return (
      <ModuleDeniedState
        title="Clientes"
        message="Você não tem permissão para listar Clientes. Se a sessão expirou, entre novamente."
      />
    );
  }

  if (listState.phase === 'error') {
    return (
      <main id="main-content" className="w-full">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Clientes</h1>
        <p
          className="mt-3 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-500/20 ring-inset"
          role="alert"
        >
          {listState.message}
        </p>
        {listState.retryable ? (
          <div className="mt-4">
            <Button type="button" variant="secondary" onClick={() => void loadPage(0, filters)}>
              Tentar novamente
            </Button>
          </div>
        ) : null}
      </main>
    );
  }

  const header = (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Clientes</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-500">
          Gerencie clientes, requisitos comerciais e vínculos operacionais.
        </p>
      </div>
      {capabilities.canCreate ? (
        <Link
          to="/app/clients/new"
          className="inline-flex min-h-9 items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white no-underline shadow-sm hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          Novo Cliente
        </Link>
      ) : null}
    </div>
  );

  if (listState.phase === 'loading') {
    return (
      <main id="main-content" className="w-full" aria-busy="true" aria-label="Carregando Clientes">
        {header}
        <div className="space-y-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </div>
      </main>
    );
  }

  const { items, offset, total, summary } = listState;
  const pageStart = total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + items.length, total);
  const pageNumber = Math.floor(offset / PAGE_SIZE) + 1;
  const hasFilters =
    filters.search.trim().length > 0 || filters.status !== '' || filters.purchaseOrderRequirement !== '';

  return (
    <main id="main-content" className="w-full">
      {header}

      <CompactKpis summary={summary} />

      <section aria-label="Filtros de clientes" className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="clients-search" className="mb-1 block text-xs font-semibold text-gray-700">
            Buscar cliente
          </label>
          <Input
            id="clients-search"
            type="search"
            autoComplete="off"
            placeholder="Buscar por razão social ou CNPJ"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          />
        </div>
        <div className="w-full sm:w-52">
          <label htmlFor="clients-status" className="mb-1 block text-xs font-semibold text-gray-700">
            Status
          </label>
          <Select
            id="clients-status"
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({ ...current, status: event.target.value as '' | ClientStatus }))
            }
          >
            <option value="">Todos</option>
            <option value={CLIENT_STATUSES.Active}>Ativos</option>
            <option value={CLIENT_STATUSES.Inactive}>Inativos</option>
          </Select>
        </div>
        <div className="w-full sm:w-64">
          <label htmlFor="clients-po" className="mb-1 block text-xs font-semibold text-gray-700">
            Requisito de PO
          </label>
          <Select
            id="clients-po"
            value={filters.purchaseOrderRequirement}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                purchaseOrderRequirement: event.target.value as '' | PurchaseOrderRequirement,
              }))
            }
          >
            {purchaseOrderRequirementOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        {hasFilters ? (
          <div>
            <Button type="button" variant="ghost" onClick={clearFilters}>
              Limpar
            </Button>
          </div>
        ) : null}
      </section>

      {items.length === 0 ? (
        <div className="rounded-xl bg-white px-6 py-12 text-center shadow-sm ring-1 ring-gray-900/5">
          {summary.total === 0 && !hasFilters ? (
            <>
              <h2 className="text-base font-semibold text-gray-900">Nenhum cliente cadastrado</h2>
              <p className="mt-1 text-sm text-gray-500">Cadastre o primeiro cliente para começar.</p>
            </>
          ) : (
            <>
              <h2 className="text-base font-semibold text-gray-900">
                Nenhum cliente encontrado para os filtros selecionados.
              </h2>
              <p className="mt-1 text-sm text-gray-500">Ajuste a busca ou limpe os filtros.</p>
              <div className="mt-4">
                <Button type="button" variant="secondary" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Mobile: cartões compactos */}
          <ul className="space-y-3 sm:hidden" aria-label="Lista de clientes (mobile)">
            {items.map((client) => (
              <li key={client.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">
                      <Link to={`/app/clients/${client.id}`} className="no-underline hover:underline">
                        {client.legalName}
                      </Link>
                    </p>
                    {client.tradeName ? <p className="truncate text-xs text-gray-500">{client.tradeName}</p> : null}
                    <p className="mt-1 font-mono text-xs text-gray-600 tabular-nums">
                      {formatCnpjDisplay(client.taxId)}
                    </p>
                  </div>
                  <ClientStatusBadge status={client.status} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <StatusBadge
                    tone={
                      client.purchaseOrderRequirement === PURCHASE_ORDER_REQUIREMENTS.NotRequired
                        ? 'neutral'
                        : 'info'
                    }
                    label={purchaseOrderLabel(client.purchaseOrderRequirement)}
                  />
                  <RowActions
                    clientId={client.id}
                    canRead={capabilities.canRead}
                    canUpdate={capabilities.canUpdate}
                  />
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop / tablet: tabela */}
          <div className="hidden overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5 sm:block">
            <table className="w-full divide-y divide-gray-200" aria-label="Lista de Clientes">
              <thead className="bg-gray-50/60">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    CNPJ
                  </th>
                  <th scope="col" className="hidden px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase lg:table-cell">
                    Requisito comercial
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((client) => (
                  <tr key={client.id} className="transition hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <p className="text-sm font-medium text-gray-900">
                        <Link to={`/app/clients/${client.id}`} className="no-underline hover:underline">
                          {client.legalName}
                        </Link>
                      </p>
                      {client.tradeName ? <p className="mt-0.5 text-xs text-gray-500">{client.tradeName}</p> : null}
                    </td>
                    <td className="px-6 py-3 font-mono text-sm text-gray-600 tabular-nums">
                      {formatCnpjDisplay(client.taxId)}
                    </td>
                    <td className="hidden px-6 py-3 lg:table-cell">
                      <StatusBadge
                        tone={
                          client.purchaseOrderRequirement === PURCHASE_ORDER_REQUIREMENTS.NotRequired
                            ? 'neutral'
                            : 'info'
                        }
                        label={purchaseOrderLabel(client.purchaseOrderRequirement)}
                      />
                    </td>
                    <td className="px-6 py-3">
                      <ClientStatusBadge status={client.status} />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <RowActions
                        clientId={client.id}
                        canRead={capabilities.canRead}
                        canUpdate={capabilities.canUpdate}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav
            aria-label="Paginação de clientes"
            className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600"
          >
            <p role="status">
              Mostrando {pageStart}–{pageEnd} de {total} clientes
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={offset === 0}
                onClick={() => void loadPage(Math.max(0, offset - PAGE_SIZE), filters)}
              >
                Anterior
              </Button>
              <span aria-hidden="true" className="text-xs text-gray-400">
                Página {pageNumber}
              </span>
              <Button
                type="button"
                variant="secondary"
                disabled={offset + items.length >= total}
                onClick={() => void loadPage(offset + PAGE_SIZE, filters)}
              >
                Próxima
              </Button>
            </div>
          </nav>
        </>
      )}
    </main>
  );
}
