import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button, DateTime, EmptyState, KpiCard, Money } from '../../ui';
import {
  FilterCard,
  ModulePage,
  ModulePageHeader,
  ModuleTableCard,
  moduleTableCellClass,
  moduleTableClass,
  moduleTableHeadClass,
  moduleTableHeaderCellClass,
  moduleTableRowClass,
} from '../../ui/module-layout';
import { renderQueryGate } from '../../financial-ui/BackofficeStates';
import { BackofficeApiError } from '../../financial-ui/enterprise-api';
import { AGING_BUCKET_LABELS, labelOrRaw } from '../../financial-ui/labels';
import { useBackofficeQuery } from '../../financial-ui/useBackofficeQuery';
import { getPayablesAging, listPayables, listReceivables, listTreasuryAccounts } from '../api/finance-api';
import { mapFinanceErrorToMessage } from '../api/finance-error-messages';
import type { PayableAgingResponse, PayableDetail, ReceivableDetail, FinancialAccount } from '../types/finance.types';

type OverviewSlice<T> = {
  data: T | null;
  error: string | null;
  retryable: boolean;
};

type OverviewData = {
  receivables: OverviewSlice<ReceivableDetail[]>;
  payables: OverviewSlice<PayableDetail[]>;
  accounts: OverviewSlice<FinancialAccount[]>;
  aging: OverviewSlice<PayableAgingResponse>;
};

function fulfilled<T>(value: T): OverviewSlice<T> {
  return { data: value, error: null, retryable: false };
}

function failed<T>(reason: unknown): OverviewSlice<T> {
  if (reason instanceof BackofficeApiError) {
    return {
      data: null,
      error: mapFinanceErrorToMessage(reason.code, reason.status),
      retryable: reason.kind === 'network' || reason.kind === 'unknown',
    };
  }
  return { data: null, error: mapFinanceErrorToMessage(undefined, 0), retryable: true };
}

function isDenied(reason: unknown): boolean {
  return reason instanceof BackofficeApiError && reason.kind === 'denied';
}

export function FinanceOverviewPage() {
  const loader = useCallback(async (signal?: AbortSignal): Promise<OverviewData> => {
    const [receivables, payables, accounts, aging] = await Promise.allSettled([
      listReceivables(signal),
      listPayables(signal),
      listTreasuryAccounts(signal),
      getPayablesAging(signal),
    ]);
    const deniedAll =
      receivables.status === 'rejected' &&
      payables.status === 'rejected' &&
      accounts.status === 'rejected' &&
      isDenied(receivables.reason) &&
      isDenied(payables.reason) &&
      isDenied(accounts.reason);
    if (deniedAll) {
      throw receivables.reason;
    }
    return {
      receivables: receivables.status === 'fulfilled' ? fulfilled(receivables.value) : failed(receivables.reason),
      payables: payables.status === 'fulfilled' ? fulfilled(payables.value) : failed(payables.reason),
      accounts: accounts.status === 'fulfilled' ? fulfilled(accounts.value) : failed(accounts.reason),
      aging: aging.status === 'fulfilled' ? fulfilled(aging.value) : failed(aging.reason),
    };
  }, []);

  const { state, reload } = useBackofficeQuery<OverviewData>({
    loader,
    mapError: mapFinanceErrorToMessage,
  });

  const gate = renderQueryGate(
    'Visão geral',
    'Carregando visão financeira…',
    'Você não tem permissão para acessar o financeiro.',
    state,
    () => void reload(),
  );
  if (gate) {
    return gate;
  }
  if (state.phase !== 'ready') {
    return null;
  }

  const { receivables, payables, accounts, aging } = state.data;
  const agingEntries = aging.data ? Object.entries(aging.data.buckets) : [];

  return (
    <ModulePage>
      <ModulePageHeader
        title="Visão geral"
        description="Painel financeiro a partir dos valores e contagens devolvidos pelo servidor. Saldos não são recalculados no navegador."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Contas a receber"
          value={receivables.data ? String(receivables.data.length) : '—'}
          ariaLabel="Quantidade de títulos a receber"
          href={receivables.data ? '/app/finance/receivables' : null}
          context={
            receivables.error ? 'Não foi possível consultar o servidor.' : 'Quantidade informada pela listagem do servidor'
          }
          footer={renderSliceRetry(receivables, reload)}
        />
        <KpiCard
          label="Contas a pagar"
          value={payables.data ? String(payables.data.length) : '—'}
          ariaLabel="Quantidade de títulos a pagar"
          href={payables.data ? '/app/finance/payables' : null}
          context={
            payables.error ? 'Não foi possível consultar o servidor.' : 'Quantidade informada pela listagem do servidor'
          }
          footer={renderSliceRetry(payables, reload)}
        />
        <KpiCard
          label="Caixa e bancos"
          value={accounts.data ? String(accounts.data.length) : '—'}
          ariaLabel="Quantidade de contas financeiras"
          href={accounts.data ? '/app/finance/treasury' : null}
          context={
            accounts.error ? 'Não foi possível consultar o servidor.' : 'Quantidade de contas devolvidas pelo servidor'
          }
          footer={renderSliceRetry(accounts, reload)}
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <Link className="font-semibold text-brand-700 no-underline" to="/app/finance/expenses">
          Despesas
        </Link>
        <Link className="font-semibold text-brand-700 no-underline" to="/app/finance/budgets">
          Orçamentos
        </Link>
        <Link className="font-semibold text-brand-700 no-underline" to="/app/finance/forecast">
          Previsão de caixa
        </Link>
      </div>

      <FilterCard>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Aging de contas a pagar</h2>
        {aging.data ? (
          <p className="mb-4 text-sm text-gray-500">
            Posição em <DateTime value={aging.data.asOf} />. Valores de cada faixa vêm do servidor.
          </p>
        ) : null}
        {aging.error ? (
          <div role="alert">
            <p className="text-sm text-red-700">Não foi possível carregar o aging: {aging.error}</p>
            {aging.retryable ? (
              <Button type="button" variant="secondary" className="mt-3" onClick={() => void reload()}>
                Tentar novamente
              </Button>
            ) : null}
          </div>
        ) : aging.data && agingEntries.length > 0 ? (
          <ModuleTableCard className="mb-0">
            <table className={moduleTableClass} aria-label="Aging de contas a pagar">
              <thead className={moduleTableHeadClass}>
                <tr>
                  <th scope="col" className={moduleTableHeaderCellClass}>
                    Faixa
                  </th>
                  <th scope="col" className={moduleTableHeaderCellClass}>
                    Quantidade
                  </th>
                  <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>
                    Saldo informado
                  </th>
                </tr>
              </thead>
              <tbody>
                {agingEntries.map(([bucket, item]) => (
                  <tr key={bucket} className={moduleTableRowClass}>
                    <td className={moduleTableCellClass}>{labelOrRaw(bucket, AGING_BUCKET_LABELS)}</td>
                    <td className={moduleTableCellClass}>{item.count}</td>
                    <td className={`${moduleTableCellClass} text-right`}>
                      <Money value={item.remaining} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ModuleTableCard>
        ) : (
          <p className="text-sm text-gray-500">Aging indisponível para o seu acesso.</p>
        )}
      </FilterCard>

      {accounts.error ? (
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5" role="alert">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">Contas de caixa e bancos</h2>
          <p className="text-sm text-red-700">Não foi possível carregar as contas: {accounts.error}</p>
          {accounts.retryable ? (
            <Button type="button" variant="secondary" className="mt-3" onClick={() => void reload()}>
              Tentar novamente
            </Button>
          ) : null}
        </div>
      ) : accounts.data && accounts.data.length > 0 ? (
        <ModuleTableCard>
          <table className={moduleTableClass} aria-label="Contas de caixa e bancos">
            <thead className={moduleTableHeadClass}>
              <tr>
                <th scope="col" className={moduleTableHeaderCellClass}>
                  Conta
                </th>
                <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>
                  Saldo do servidor
                </th>
              </tr>
            </thead>
            <tbody>
              {accounts.data.map((account) => (
                <tr key={account.id} className={moduleTableRowClass}>
                  <td className={moduleTableCellClass}>
                    <Link
                      to={`/app/finance/treasury/${account.id}`}
                      className="font-semibold text-brand-700 no-underline"
                    >
                      {account.name}
                    </Link>
                    <span className="ml-2 font-mono text-xs text-gray-500">{account.code}</span>
                  </td>
                  <td className={`${moduleTableCellClass} text-right`}>
                    <Money value={account.balance} currencyCode={account.currencyCode} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ModuleTableCard>
      ) : (
        <EmptyState
          title="Sem contas financeiras visíveis"
          description="Nenhuma conta de caixa ou banco foi devolvida pelo servidor para o seu escopo."
        />
      )}
    </ModulePage>
  );
}

function renderSliceRetry(slice: OverviewSlice<unknown>, reload: () => Promise<void>) {
  if (!slice.error) {
    return undefined;
  }
  return (
    <div className="mt-2" role="alert">
      <p className="text-xs text-red-700">{slice.error}</p>
      {slice.retryable ? (
        <Button type="button" variant="secondary" className="mt-2" onClick={() => void reload()}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}
