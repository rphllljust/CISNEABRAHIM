import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DateTime, EmptyState, KpiCard, Money } from '../../ui';
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
import { AGING_BUCKET_LABELS, labelOrRaw } from '../../financial-ui/labels';
import { useBackofficeQuery } from '../../financial-ui/useBackofficeQuery';
import { getPayablesAging, listPayables, listReceivables, listTreasuryAccounts } from '../api/finance-api';
import { mapFinanceErrorToMessage } from '../api/finance-error-messages';
import type { PayableAgingResponse, PayableDetail, ReceivableDetail, FinancialAccount } from '../types/finance.types';

type OverviewData = {
  receivables: ReceivableDetail[] | null;
  payables: PayableDetail[] | null;
  accounts: FinancialAccount[] | null;
  aging: PayableAgingResponse | null;
};

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
      accounts.status === 'rejected';
    if (deniedAll) {
      throw receivables.reason;
    }
    return {
      receivables: receivables.status === 'fulfilled' ? receivables.value : null,
      payables: payables.status === 'fulfilled' ? payables.value : null,
      accounts: accounts.status === 'fulfilled' ? accounts.value : null,
      aging: aging.status === 'fulfilled' ? aging.value : null,
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
  const agingEntries = aging ? Object.entries(aging.buckets) : [];

  return (
    <ModulePage>
      <ModulePageHeader
        title="Visão geral"
        description="Painel financeiro a partir dos valores e contagens devolvidos pelo servidor. Saldos não são recalculados no navegador."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Contas a receber"
          value={receivables ? String(receivables.length) : '—'}
          ariaLabel="Quantidade de títulos a receber"
          href="/app/finance/receivables"
          context="Quantidade informada pela listagem do servidor"
        />
        <KpiCard
          label="Contas a pagar"
          value={payables ? String(payables.length) : '—'}
          ariaLabel="Quantidade de títulos a pagar"
          href="/app/finance/payables"
          context="Quantidade informada pela listagem do servidor"
        />
        <KpiCard
          label="Caixa e bancos"
          value={accounts ? String(accounts.length) : '—'}
          ariaLabel="Quantidade de contas financeiras"
          href="/app/finance/treasury"
          context="Quantidade de contas devolvidas pelo servidor"
        />
      </div>

      <FilterCard>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Aging de contas a pagar</h2>
        {aging ? (
          <p className="mb-4 text-sm text-gray-500">
            Posição em <DateTime value={aging.asOf} />. Valores de cada faixa vêm do servidor.
          </p>
        ) : (
          <p className="text-sm text-gray-500">Aging indisponível para o seu acesso.</p>
        )}
        {aging && agingEntries.length > 0 ? (
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
        ) : null}
      </FilterCard>

      {accounts && accounts.length > 0 ? (
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
              {accounts.map((account) => (
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
