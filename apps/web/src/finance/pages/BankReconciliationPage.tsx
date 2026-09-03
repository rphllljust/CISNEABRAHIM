import { useCallback, useRef, useState } from 'react';
import { Button, DateTime, EmptyState, Field, Input, Money, Textarea } from '../../ui';
import {
  FilterCard,
  ModulePage,
  ModulePageHeader,
  ModulePagination,
  ModuleTableCard,
  filterControlClass,
  moduleTableCellClass,
  moduleTableClass,
  moduleTableHeadClass,
  moduleTableHeaderCellClass,
  moduleTableRowClass,
} from '../../ui/module-layout';
import { BackofficeApiError } from '../../financial-ui/enterprise-api';
import { createIdempotencyKey } from '../../financial-ui/idempotency';
import { MATCH_STATUS_LABELS, MOVEMENT_DIRECTION_LABELS, STATEMENT_STATUS_LABELS } from '../../financial-ui/labels';
import { ProcessingBanner } from '../../financial-ui/ProcessingBanner';
import { RecordLookupCard } from '../../financial-ui/RecordLookupCard';
import { sliceTablePage, tablePageCount } from '../../financial-ui/table-slice';
import { autoMatchStatement, getBankStatement, importBankFile } from '../api/finance-api';
import { mapFinanceErrorToMessage } from '../api/finance-error-messages';
import { FinanceStatusBadge } from '../components/FinanceStatusBadge';
import type { AutoMatchResult, BankStatement } from '../types/finance.types';

type PageState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'denied' }
  | { phase: 'error'; message: string; retryable: boolean }
  | { phase: 'ready'; statement: BankStatement; autoMatch?: AutoMatchResult };

export function BankReconciliationPage() {
  const [statementId, setStatementId] = useState('');
  const [state, setState] = useState<PageState>({ phase: 'idle' });
  const [pageNumber, setPageNumber] = useState(1);
  const [importFields, setImportFields] = useState({
    unitId: '',
    financialAccountId: '',
    fileName: 'extrato.json',
    content: '',
  });
  const [processing, setProcessing] = useState(false);
  const inflight = useRef(false);
  const idempotencyKey = useRef(createIdempotencyKey());

  const loadStatement = useCallback(async (id: string, signal?: AbortSignal) => {
    setState({ phase: 'loading' });
    try {
      const statement = await getBankStatement(id, signal);
      setPageNumber(1);
      setState({ phase: 'ready', statement });
    } catch (error) {
      if (error instanceof BackofficeApiError && error.kind === 'denied') {
        setState({ phase: 'denied' });
        return;
      }
      setState({
        phase: 'error',
        message:
          error instanceof BackofficeApiError
            ? mapFinanceErrorToMessage(error.code, error.status)
            : 'Não foi possível carregar o extrato.',
        retryable: true,
      });
    }
  }, []);

  async function handleImport() {
    if (inflight.current) {
      return;
    }
    inflight.current = true;
    setProcessing(true);
    try {
      const statement = await importBankFile({
        ...importFields,
        idempotencyKey: idempotencyKey.current,
      });
      idempotencyKey.current = createIdempotencyKey();
      setStatementId(statement.id);
      setState({ phase: 'ready', statement });
    } catch (error) {
      setState({
        phase: 'error',
        message:
          error instanceof BackofficeApiError
            ? mapFinanceErrorToMessage(error.code, error.status)
            : 'Não foi possível importar o extrato.',
        retryable: true,
      });
    } finally {
      inflight.current = false;
      setProcessing(false);
    }
  }

  async function handleAutoMatch() {
    if (state.phase !== 'ready' || inflight.current) {
      return;
    }
    inflight.current = true;
    setProcessing(true);
    try {
      const autoMatch = await autoMatchStatement(state.statement.id);
      const statement = await getBankStatement(state.statement.id);
      setState({ phase: 'ready', statement, autoMatch });
    } catch (error) {
      setState({
        phase: 'error',
        message:
          error instanceof BackofficeApiError
            ? mapFinanceErrorToMessage(error.code, error.status)
            : 'Não foi possível conciliar o extrato.',
        retryable: true,
      });
    } finally {
      inflight.current = false;
      setProcessing(false);
    }
  }

  if (state.phase === 'denied') {
    return (
      <ModulePage>
        <ModulePageHeader title="Conciliação" />
        <p className="text-sm text-red-700" role="alert">
          Você não tem permissão para acessar conciliação bancária.
        </p>
      </ModulePage>
    );
  }

  const statement = state.phase === 'ready' ? state.statement : null;
  const lines = statement?.lines ?? [];
  const pageCount = tablePageCount(lines.length);
  const pageItems = sliceTablePage(lines, Math.min(pageNumber, pageCount));

  return (
    <ModulePage>
      <ModulePageHeader
        title="Conciliação"
        description="Importação e vínculos usam o motor do servidor. OFX/CNAB não documentados são recusados pelo backend."
      />

      <RecordLookupCard
        title="Consultar extrato"
        fieldId="statement-id"
        label="Identificador do extrato"
        value={statementId}
        onChange={setStatementId}
        onSubmit={() => void loadStatement(statementId.trim())}
        submitLabel="Consultar"
        loading={state.phase === 'loading'}
      />

      <FilterCard>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Importar arquivo autorizado</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Unidade" htmlFor="import-unit">
            <Input
              id="import-unit"
              className={filterControlClass}
              value={importFields.unitId}
              onChange={(event) => setImportFields((current) => ({ ...current, unitId: event.target.value }))}
            />
          </Field>
          <Field label="Conta financeira" htmlFor="import-account">
            <Input
              id="import-account"
              className={filterControlClass}
              value={importFields.financialAccountId}
              onChange={(event) =>
                setImportFields((current) => ({ ...current, financialAccountId: event.target.value }))
              }
            />
          </Field>
        </div>
        <Field label="Conteúdo" htmlFor="import-content" className="mt-4">
          <Textarea
            id="import-content"
            value={importFields.content}
            onChange={(event) => setImportFields((current) => ({ ...current, content: event.target.value }))}
          />
        </Field>
        <div className="mt-4">
          <Button type="button" onClick={() => void handleImport()} loading={processing} disabled={processing}>
            Enviar ao servidor
          </Button>
        </div>
      </FilterCard>

      {processing ? <div className="mb-4"><ProcessingBanner /></div> : null}

      {state.phase === 'error' ? (
        <p className="mb-4 text-sm text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}

      {state.phase === 'idle' && !statement ? (
        <EmptyState
          title="Nenhum extrato carregado"
          description="Consulte um extrato existente ou envie um arquivo no formato autorizado."
        />
      ) : null}

      {statement ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <FinanceStatusBadge status={statement.status} labels={STATEMENT_STATUS_LABELS} />
            <span className="text-sm text-gray-500">
              {statement.periodStartsOn} — {statement.periodEndsOn}
            </span>
            <Button type="button" variant="secondary" onClick={() => void handleAutoMatch()} disabled={processing}>
              Sugerir vínculos
            </Button>
          </div>
          {state.phase === 'ready' && state.autoMatch ? (
            <p className="mb-4 text-sm text-gray-600" role="status">
              Servidor sugeriu {state.autoMatch.suggested.length} vínculos, {state.autoMatch.unmatched.length} sem
              correspondência e {state.autoMatch.reviewRequired.length} em revisão.
            </p>
          ) : null}
          {lines.length === 0 ? (
            <EmptyState title="Extrato sem linhas" />
          ) : (
            <>
              <ModuleTableCard>
                <table className={moduleTableClass} aria-label="Linhas do extrato bancário">
                  <thead className={moduleTableHeadClass}>
                    <tr>
                      <th scope="col" className={moduleTableHeaderCellClass}>
                        Linha
                      </th>
                      <th scope="col" className={moduleTableHeaderCellClass}>
                        Data
                      </th>
                      <th scope="col" className={moduleTableHeaderCellClass}>
                        Descrição
                      </th>
                      <th scope="col" className={moduleTableHeaderCellClass}>
                        Vínculo
                      </th>
                      <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>
                        Valor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((line) => (
                      <tr key={line.id} className={moduleTableRowClass}>
                        <td className={moduleTableCellClass}>{line.lineNumber}</td>
                        <td className={moduleTableCellClass}>
                          <DateTime value={line.occurredOn} mode="date" />
                        </td>
                        <td className={`${moduleTableCellClass} max-w-xs whitespace-normal`}>
                          {line.description}
                          <span className="ml-2 text-xs text-gray-500">
                            {MOVEMENT_DIRECTION_LABELS[line.direction] ?? line.direction}
                          </span>
                        </td>
                        <td className={moduleTableCellClass}>
                          <FinanceStatusBadge status={line.matchStatus} labels={MATCH_STATUS_LABELS} />
                        </td>
                        <td className={`${moduleTableCellClass} text-right`}>
                          <Money value={line.amount} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ModuleTableCard>
              <ModulePagination
                pageNumber={Math.min(pageNumber, pageCount)}
                rangeLabel={`Página ${Math.min(pageNumber, pageCount)} de ${pageCount} · ${lines.length} linhas`}
                onPrevious={() => setPageNumber((current) => Math.max(1, current - 1))}
                onNext={() => setPageNumber((current) => Math.min(pageCount, current + 1))}
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
