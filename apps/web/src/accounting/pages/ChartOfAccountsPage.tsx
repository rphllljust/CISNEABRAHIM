import { useCallback, useState } from 'react';
import { EmptyState, Money } from '../../ui';
import {
  ModulePage,
  ModulePageHeader,
  ModulePagination,
  ModuleTableCard,
  moduleTableCellClass,
  moduleTableClass,
  moduleTableHeadClass,
  moduleTableHeaderCellClass,
  moduleTableRowClass,
} from '../../ui/module-layout';
import { DefinitionList } from '../../financial-ui/DefinitionList';
import { RecordLookupCard } from '../../financial-ui/RecordLookupCard';
import { sliceTablePage, tablePageCount } from '../../financial-ui/table-slice';
import { renderQueryGate } from '../../financial-ui/BackofficeStates';
import { useBackofficeQuery } from '../../financial-ui/useBackofficeQuery';
import { getChart, reconstructLedger } from '../api/accounting-api';
import { mapAccountingErrorToMessage } from '../api/accounting-error-messages';
import type { ChartOfAccounts, LedgerReconstruction } from '../types/accounting.types';

type ChartView = {
  chart: ChartOfAccounts;
  ledger: LedgerReconstruction;
};

export function ChartOfAccountsPage() {
  const [chartId, setChartId] = useState('');
  const [activeId, setActiveId] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const loader = useCallback(async (signal?: AbortSignal): Promise<ChartView> => {
    const [chart, ledger] = await Promise.all([getChart(activeId, signal), reconstructLedger(activeId, signal)]);
    return { chart, ledger };
  }, [activeId]);
  const { state, reload } = useBackofficeQuery<ChartView>({
    loader,
    mapError: mapAccountingErrorToMessage,
    enabled: Boolean(activeId),
    autoLoad: Boolean(activeId),
  });

  const gate = activeId
    ? renderQueryGate(
        'Plano de contas',
        'Carregando plano de contas…',
        'Você não tem permissão para consultar o plano de contas.',
        state,
        () => void reload(),
      )
    : null;

  const accounts = state.phase === 'ready' ? state.data.ledger.accounts : [];
  const pageCount = tablePageCount(accounts.length);
  const pageItems = sliceTablePage(accounts, Math.min(pageNumber, pageCount));

  return (
    <ModulePage>
      <ModulePageHeader
        title="Plano de contas"
        description="Saldos por conta são a reconstrução oficial do servidor. O navegador não soma débito e crédito."
      />
      <RecordLookupCard
        fieldId="chart-id"
        label="Identificador do plano"
        value={chartId}
        onChange={setChartId}
        onSubmit={() => {
          setPageNumber(1);
          setActiveId(chartId.trim());
        }}
        submitLabel="Consultar"
        loading={state.phase === 'loading'}
      />
      {gate}
      {!activeId ? (
        <EmptyState
          title="Nenhum plano carregado"
          description="Consulte um plano de contas pelo identificador persistido."
        />
      ) : null}
      {state.phase === 'ready' ? (
        <>
          <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
            <DefinitionList
              items={[
                { label: 'Código', value: state.data.chart.code },
                { label: 'Nome', value: state.data.chart.name },
                { label: 'Status', value: state.data.chart.status },
                { label: 'Balanceado', value: state.data.ledger.balanced ? 'Sim' : 'Não' },
                { label: 'Débitos', value: <Money value={state.data.ledger.totalDebits} /> },
                { label: 'Créditos', value: <Money value={state.data.ledger.totalCredits} /> },
              ]}
            />
          </div>
          <ModuleTableCard>
            <table className={moduleTableClass} aria-label="Saldos do plano de contas">
              <thead className={moduleTableHeadClass}>
                <tr>
                  <th scope="col" className={moduleTableHeaderCellClass}>
                    Conta
                  </th>
                  <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>
                    Débitos
                  </th>
                  <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>
                    Créditos
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((account) => (
                  <tr key={account.accountId} className={moduleTableRowClass}>
                    <td className={`${moduleTableCellClass} font-mono`}>{account.accountId}</td>
                    <td className={`${moduleTableCellClass} text-right`}>
                      <Money value={account.debits} />
                    </td>
                    <td className={`${moduleTableCellClass} text-right`}>
                      <Money value={account.credits} />
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
      ) : null}
    </ModulePage>
  );
}
