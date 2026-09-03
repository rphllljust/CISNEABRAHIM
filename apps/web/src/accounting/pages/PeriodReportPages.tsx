import { useCallback, useState, type ReactNode } from 'react';
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
import { ACCOUNT_CLASS_LABELS, JOURNAL_STATUS_LABELS, labelOrRaw } from '../../financial-ui/labels';
import { RecordLookupCard } from '../../financial-ui/RecordLookupCard';
import { sliceTablePage, tablePageCount } from '../../financial-ui/table-slice';
import { renderQueryGate } from '../../financial-ui/BackofficeStates';
import { useBackofficeQuery } from '../../financial-ui/useBackofficeQuery';
import {
  getBalanceSheet,
  getGeneralLedger,
  getIncomeStatement,
  getJournalBook,
  getTrialBalance,
} from '../api/accounting-api';
import { mapAccountingErrorToMessage } from '../api/accounting-error-messages';
import { FinanceStatusBadge } from '../../finance/components/FinanceStatusBadge';
import type {
  BalanceSheet,
  GeneralLedger,
  IncomeStatement,
  JournalBook,
  TrialBalance,
} from '../types/accounting.types';

export function JournalBookPage() {
  const loaderFor = useCallback((periodId: string, signal?: AbortSignal) => getJournalBook(periodId, signal), []);
  const [pageNumber, setPageNumber] = useState(1);

  return (
    <PeriodLookupInner<JournalBook, JournalBook['entries'][number]>
      title="Diário"
      description="O diário lista apenas lançamentos postados devolvidos pelo servidor."
      tableLabel="Livro diário"
      loaderFor={loaderFor}
      pageNumber={pageNumber}
      onPageNumberChange={setPageNumber}
      renderSummary={(data) => [
        { label: 'Origem', value: data.source },
        { label: 'Balanceado', value: data.balanced ? 'Sim' : 'Não' },
        { label: 'Débitos', value: <Money value={data.totalDebits} /> },
        { label: 'Créditos', value: <Money value={data.totalCredits} /> },
        { label: 'Diferença', value: <Money value={data.difference} /> },
      ]}
      items={(data) => data.entries}
      renderHead={() => (
        <tr>
          <th scope="col" className={moduleTableHeaderCellClass}>
            Lançamento
          </th>
          <th scope="col" className={moduleTableHeaderCellClass}>
            Status
          </th>
          <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>
            Débito
          </th>
          <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>
            Crédito
          </th>
        </tr>
      )}
      renderRow={(entry) => (
        <tr key={entry.id} className={moduleTableRowClass}>
          <td className={`${moduleTableCellClass} whitespace-normal`}>{entry.description}</td>
          <td className={moduleTableCellClass}>
            <FinanceStatusBadge status={entry.status} labels={JOURNAL_STATUS_LABELS} />
          </td>
          <td className={`${moduleTableCellClass} text-right`}>
            <Money value={entry.debitTotal} />
          </td>
          <td className={`${moduleTableCellClass} text-right`}>
            <Money value={entry.creditTotal} />
          </td>
        </tr>
      )}
    />
  );
}

export function GeneralLedgerPage() {
  const loaderFor = useCallback((periodId: string, signal?: AbortSignal) => getGeneralLedger(periodId, signal), []);
  const [pageNumber, setPageNumber] = useState(1);

  return (
    <PeriodLookupInner<GeneralLedger, GeneralLedger['accounts'][number]>
      title="Razão"
      description="Saldos de abertura, movimento e fechamento vêm da reconstrução oficial do período."
      tableLabel="Razão geral"
      loaderFor={loaderFor}
      pageNumber={pageNumber}
      onPageNumberChange={setPageNumber}
      renderSummary={(data) => [
        { label: 'Origem', value: data.source },
        { label: 'Contas', value: String(data.accounts.length) },
      ]}
      items={(data) => data.accounts}
      renderHead={() => (
        <tr>
          <th scope="col" className={moduleTableHeaderCellClass}>
            Conta
          </th>
          <th scope="col" className={moduleTableHeaderCellClass}>
            Classe
          </th>
          <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>
            Débito final
          </th>
          <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>
            Crédito final
          </th>
        </tr>
      )}
      renderRow={(account) => (
        <tr key={account.accountId} className={moduleTableRowClass}>
          <td className={moduleTableCellClass}>
            <span className="font-mono text-xs text-gray-500">{account.code}</span> {account.name}
          </td>
          <td className={moduleTableCellClass}>{labelOrRaw(account.class, ACCOUNT_CLASS_LABELS)}</td>
          <td className={`${moduleTableCellClass} text-right`}>
            <Money value={account.closingBalanceDebit} />
          </td>
          <td className={`${moduleTableCellClass} text-right`}>
            <Money value={account.closingBalanceCredit} />
          </td>
        </tr>
      )}
    />
  );
}

export function IncomeStatementPage() {
  const loaderFor = useCallback(
    (periodId: string, signal?: AbortSignal) => getIncomeStatement(periodId, signal),
    [],
  );
  const [pageNumber, setPageNumber] = useState(1);

  return (
    <PeriodLookupInner<IncomeStatement, { id: string; label: string; value: string }>
      title="DRE"
      description="Receita, despesa e resultado vêm só de lançamentos POSTED. Esta tela não classifica conta nem recalcula o resultado."
      tableLabel="Demonstração do resultado"
      loaderFor={loaderFor}
      pageNumber={pageNumber}
      onPageNumberChange={setPageNumber}
      renderSummary={(data) => [
        { label: 'Origem', value: data.source },
        { label: 'Receita', value: <Money value={data.revenue} /> },
        { label: 'Despesa', value: <Money value={data.expense} /> },
        { label: 'Resultado', value: <Money value={data.netIncome} /> },
      ]}
      items={(data) => [
        { id: 'revenue', label: 'Receita', value: data.revenue },
        { id: 'expense', label: 'Despesa', value: data.expense },
        { id: 'net-income', label: 'Resultado', value: data.netIncome },
      ]}
      renderHead={() => (
        <tr>
          <th scope="col" className={moduleTableHeaderCellClass}>
            Grupo
          </th>
          <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>
            Valor
          </th>
        </tr>
      )}
      renderRow={(row) => (
        <tr key={row.id} className={moduleTableRowClass}>
          <td className={moduleTableCellClass}>{row.label}</td>
          <td className={`${moduleTableCellClass} text-right`}>
            <Money value={row.value} />
          </td>
        </tr>
      )}
    />
  );
}

export function BalanceSheetPage() {
  const loaderFor = useCallback(
    (periodId: string, signal?: AbortSignal) => getBalanceSheet(periodId, signal),
    [],
  );
  const [pageNumber, setPageNumber] = useState(1);

  return (
    <PeriodLookupInner<BalanceSheet, { id: string; label: string; value: string }>
      title="Balanço patrimonial"
      description="Ativo, passivo, patrimônio e resultado do período vêm só de lançamentos POSTED. Esta tela não inventa classificação."
      tableLabel="Balanço patrimonial"
      loaderFor={loaderFor}
      pageNumber={pageNumber}
      onPageNumberChange={setPageNumber}
      renderSummary={(data) => [
        { label: 'Origem', value: data.source },
        { label: 'Ativo', value: <Money value={data.assets} /> },
        { label: 'Passivo', value: <Money value={data.liabilities} /> },
        { label: 'Patrimônio', value: <Money value={data.equity} /> },
        { label: 'Resultado do período', value: <Money value={data.netIncome} /> },
        { label: 'Equação', value: data.balanced ? 'Sim' : 'Não' },
      ]}
      items={(data) => [
        { id: 'assets', label: 'Ativo', value: data.assets },
        { id: 'liabilities', label: 'Passivo', value: data.liabilities },
        { id: 'equity', label: 'Patrimônio', value: data.equity },
        { id: 'net-income', label: 'Resultado do período', value: data.netIncome },
      ]}
      renderHead={() => (
        <tr>
          <th scope="col" className={moduleTableHeaderCellClass}>
            Grupo
          </th>
          <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>
            Valor
          </th>
        </tr>
      )}
      renderRow={(row) => (
        <tr key={row.id} className={moduleTableRowClass}>
          <td className={moduleTableCellClass}>{row.label}</td>
          <td className={`${moduleTableCellClass} text-right`}>
            <Money value={row.value} />
          </td>
        </tr>
      )}
    />
  );
}

export function TrialBalancePage() {
  const loaderFor = useCallback((periodId: string, signal?: AbortSignal) => getTrialBalance(periodId, signal), []);
  const [pageNumber, setPageNumber] = useState(1);

  return (
    <PeriodLookupInner<TrialBalance, TrialBalance['accounts'][number]>
      title="Balancete"
      description="Totais e diferença são os calculados pelo servidor. Esta tela não refecha o balancete."
      tableLabel="Balancete"
      loaderFor={loaderFor}
      pageNumber={pageNumber}
      onPageNumberChange={setPageNumber}
      renderSummary={(data) => [
        { label: 'Balanceado', value: data.balanced ? 'Sim' : 'Não' },
        { label: 'Débitos', value: <Money value={data.totalDebits} /> },
        { label: 'Créditos', value: <Money value={data.totalCredits} /> },
        { label: 'Diferença', value: <Money value={data.difference} /> },
      ]}
      items={(data) => data.accounts}
      renderHead={() => (
        <tr>
          <th scope="col" className={moduleTableHeaderCellClass}>
            Conta
          </th>
          <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>
            Débito
          </th>
          <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>
            Crédito
          </th>
        </tr>
      )}
      renderRow={(account) => (
        <tr key={account.accountId} className={moduleTableRowClass}>
          <td className={moduleTableCellClass}>
            <span className="font-mono text-xs text-gray-500">{account.code}</span> {account.name}
          </td>
          <td className={`${moduleTableCellClass} text-right`}>
            <Money value={account.debit} />
          </td>
          <td className={`${moduleTableCellClass} text-right`}>
            <Money value={account.credit} />
          </td>
        </tr>
      )}
    />
  );
}

function PeriodLookupInner<T, TItem>({
  title,
  description,
  tableLabel,
  loaderFor,
  pageNumber,
  onPageNumberChange,
  renderSummary,
  items,
  renderHead,
  renderRow,
}: {
  title: string;
  description: string;
  tableLabel: string;
  loaderFor: (periodId: string, signal?: AbortSignal) => Promise<T>;
  pageNumber: number;
  onPageNumberChange: (page: number) => void;
  renderSummary: (data: T) => Array<{ label: string; value: ReactNode }>;
  items: (data: T) => TItem[];
  renderHead: () => ReactNode;
  renderRow: (item: TItem) => ReactNode;
}) {
  const [periodId, setPeriodId] = useState('');
  const [activeId, setActiveId] = useState('');
  const loader = useCallback((signal?: AbortSignal) => loaderFor(activeId, signal), [activeId, loaderFor]);
  const { state, reload } = useBackofficeQuery<T>({
    loader,
    mapError: mapAccountingErrorToMessage,
    enabled: Boolean(activeId),
    autoLoad: Boolean(activeId),
  });
  const gate = activeId
    ? renderQueryGate(
        title,
        `Carregando ${title.toLowerCase()}…`,
        `Você não tem permissão para consultar ${title.toLowerCase()}.`,
        state,
        () => void reload(),
      )
    : null;
  const rows = state.phase === 'ready' ? items(state.data) : [];
  const pageCount = tablePageCount(rows.length);
  const pageItems = sliceTablePage(rows, Math.min(pageNumber, pageCount));

  return (
    <ModulePage>
      <ModulePageHeader title={title} description={description} />
      <RecordLookupCard
        fieldId={`${title}-period-id`}
        label="Identificador do período"
        value={periodId}
        onChange={setPeriodId}
        onSubmit={() => {
          onPageNumberChange(1);
          setActiveId(periodId.trim());
        }}
        submitLabel="Consultar"
        loading={state.phase === 'loading'}
      />
      {gate}
      {!activeId ? (
        <EmptyState title="Nenhum período carregado" description="Informe o período contábil devolvido pelo servidor." />
      ) : null}
      {state.phase === 'ready' ? (
        <>
          <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
            <DefinitionList items={renderSummary(state.data)} />
          </div>
          {rows.length === 0 ? (
            <EmptyState title="Sem movimentos neste período" />
          ) : (
            <>
              <ModuleTableCard>
                <table className={moduleTableClass} aria-label={tableLabel}>
                  <thead className={moduleTableHeadClass}>{renderHead()}</thead>
                  <tbody>{pageItems.map((item) => renderRow(item))}</tbody>
                </table>
              </ModuleTableCard>
              <ModulePagination
                pageNumber={Math.min(pageNumber, pageCount)}
                rangeLabel={`Página ${Math.min(pageNumber, pageCount)} de ${pageCount} · ${rows.length} linhas`}
                onPrevious={() => onPageNumberChange(Math.max(1, pageNumber - 1))}
                onNext={() => onPageNumberChange(Math.min(pageCount, pageNumber + 1))}
                previousDisabled={pageNumber <= 1}
                nextDisabled={pageNumber >= pageCount}
              />
            </>
          )}
        </>
      ) : null}
    </ModulePage>
  );
}
