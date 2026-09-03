import { useCallback, useState } from 'react';
import { EmptyState, Money } from '../../ui';
import {
  ModulePage,
  ModulePageHeader,
  ModulePagination,
  ModuleTableCard,
  ModuleTableLink,
  moduleTableCellClass,
  moduleTableClass,
  moduleTableHeadClass,
  moduleTableHeaderCellClass,
  moduleTableRowClass,
} from '../../ui/module-layout';
import { renderQueryGate } from '../../financial-ui/BackofficeStates';
import { TREASURY_KIND_LABELS, TREASURY_LIFECYCLE_LABELS } from '../../financial-ui/labels';
import { sliceTablePage, tablePageCount } from '../../financial-ui/table-slice';
import { useBackofficeQuery } from '../../financial-ui/useBackofficeQuery';
import { listTreasuryAccounts } from '../api/finance-api';
import { mapFinanceErrorToMessage } from '../api/finance-error-messages';
import { FinanceStatusBadge } from '../components/FinanceStatusBadge';
import type { FinancialAccount } from '../types/finance.types';

export function TreasuryListPage() {
  const [pageNumber, setPageNumber] = useState(1);
  const loader = useCallback((signal?: AbortSignal) => listTreasuryAccounts(signal), []);
  const { state, reload } = useBackofficeQuery<FinancialAccount[]>({
    loader,
    mapError: mapFinanceErrorToMessage,
  });

  const gate = renderQueryGate(
    'Caixa e bancos',
    'Carregando contas financeiras…',
    'Você não tem permissão para listar caixa e bancos.',
    state,
    () => void reload(),
  );
  if (gate) {
    return gate;
  }
  if (state.phase !== 'ready') {
    return null;
  }

  const pageCount = tablePageCount(state.data.length);
  const pageItems = sliceTablePage(state.data, Math.min(pageNumber, pageCount));

  return (
    <ModulePage>
      <ModulePageHeader
        title="Caixa e bancos"
        description="O saldo de cada conta é o valor reconstruído pelo servidor. Esta tela não soma nem recalcula."
      />
      {state.data.length === 0 ? (
        <EmptyState title="Nenhuma conta financeira" description="O servidor não devolveu contas no seu escopo." />
      ) : (
        <>
          <ModuleTableCard>
            <table className={moduleTableClass} aria-label="Lista de caixa e bancos">
              <thead className={moduleTableHeadClass}>
                <tr>
                  <th scope="col" className={moduleTableHeaderCellClass}>
                    Conta
                  </th>
                  <th scope="col" className={moduleTableHeaderCellClass}>
                    Tipo
                  </th>
                  <th scope="col" className={moduleTableHeaderCellClass}>
                    Situação
                  </th>
                  <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>
                    Saldo do servidor
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((account) => (
                  <tr key={account.id} className={moduleTableRowClass}>
                    <td className={moduleTableCellClass}>
                      <ModuleTableLink to={`/app/finance/treasury/${account.id}`}>{account.name}</ModuleTableLink>
                      <span className="ml-2 font-mono text-xs text-gray-500">{account.code}</span>
                    </td>
                    <td className={moduleTableCellClass}>
                      <FinanceStatusBadge status={account.kind} labels={TREASURY_KIND_LABELS} />
                    </td>
                    <td className={moduleTableCellClass}>
                      <FinanceStatusBadge status={account.lifecycle} labels={TREASURY_LIFECYCLE_LABELS} />
                    </td>
                    <td className={`${moduleTableCellClass} text-right`}>
                      <Money value={account.balance} currencyCode={account.currencyCode} emphasis />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ModuleTableCard>
          <ModulePagination
            pageNumber={Math.min(pageNumber, pageCount)}
            rangeLabel={`Página ${Math.min(pageNumber, pageCount)} de ${pageCount}`}
            onPrevious={() => setPageNumber((current) => Math.max(1, current - 1))}
            onNext={() => setPageNumber((current) => Math.min(pageCount, current + 1))}
            previousDisabled={pageNumber <= 1}
            nextDisabled={pageNumber >= pageCount}
          />
        </>
      )}
    </ModulePage>
  );
}
