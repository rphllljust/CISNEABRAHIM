import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { listPurchaseOrders, PurchaseOrdersApiError } from '../api/purchase-orders-api';
import { mapPurchaseOrderErrorToMessage } from '../api/purchase-order-error-messages';
import { PurchaseOrderStatusBadge } from '../components/PurchaseOrderStatusBadge';
import { usePurchaseOrderCapabilities } from '../hooks/usePurchaseOrderCapabilities';
import type { PurchaseOrder } from '../types/purchase-order.types';
import { formatDateTime, formatMoney } from '../utils/purchase-order-labels';

const PAGE_SIZE = 20;

type ListState =
  | { phase: 'loading' }
  | { phase: 'denied' }
  | { phase: 'error'; message: string; retryable: boolean }
  | { phase: 'ready'; items: PurchaseOrder[]; offset: number; hasMore: boolean };

export function PurchaseOrdersListPage() {
  const { capabilities } = usePurchaseOrderCapabilities();
  const [clientFilter, setClientFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [listState, setListState] = useState<ListState>({ phase: 'loading' });

  const loadPage = useCallback(
    async (offset: number, signal?: AbortSignal) => {
      setListState({ phase: 'loading' });
      try {
        const response = await listPurchaseOrders(
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
        if (error instanceof PurchaseOrdersApiError) {
          if (error.kind === 'denied') {
            setListState({ phase: 'denied' });
            return;
          }
          setListState({
            phase: 'error',
            message: mapPurchaseOrderErrorToMessage(error.code, error.status),
            retryable: error.kind === 'network' || error.kind === 'unknown',
          });
          return;
        }
        setListState({
          phase: 'error',
          message: 'Não foi possível carregar os pedidos de compra.',
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
        <h1>Pedidos de compra</h1>
        <p aria-busy="true" aria-live="polite">
          Carregando pedidos…
        </p>
      </main>
    );
  }

  if (listState.phase === 'denied') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Pedidos de compra</h1>
        <p role="alert">Você não tem permissão para listar pedidos de compra.</p>
        <Link to="/app">Voltar ao início</Link>
      </main>
    );
  }

  if (listState.phase === 'error') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Pedidos de compra</h1>
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
        <h1>Pedidos de compra</h1>
        {capabilities.canCreate ? (
          <Link to="/app/purchase-orders/new" className="button-link">
            Novo pedido
          </Link>
        ) : null}
      </header>

      <div className="requests-toolbar">
        <div className="form-field requests-filter">
          <label htmlFor="po-client-filter">Cliente (ID)</label>
          <input
            id="po-client-filter"
            type="search"
            value={clientFilter}
            onChange={(event) => setClientFilter(event.target.value)}
            placeholder="UUID do cliente"
          />
        </div>
        <div className="form-field requests-filter">
          <label htmlFor="po-unit-filter">Unidade</label>
          <input
            id="po-unit-filter"
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
        <p role="status">Nenhum pedido de compra encontrado.</p>
      ) : (
        <table className="requests-table" aria-label="Lista de pedidos de compra">
          <thead>
            <tr>
              <th scope="col">Nº PO</th>
              <th scope="col">Código interno</th>
              <th scope="col">Status</th>
              <th scope="col">Valor</th>
              <th scope="col">Unidade</th>
              <th scope="col">Atualizado em</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link to={`/app/purchase-orders/${item.id}`}>{item.poNumber}</Link>
                </td>
                <td>{item.internalCode}</td>
                <td>
                  <PurchaseOrderStatusBadge status={item.status} />
                </td>
                <td className="numeric">{formatMoney(item.totalAmount, item.currencyCode)}</td>
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
