import { useCallback, useRef, useState } from 'react';
import { Button, DateTime, EmptyState, Field, Input, Money, Select, Textarea, VersionConflictBanner } from '../../ui';
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
import { VersionedActionForm } from '../../financial-ui/VersionedActionForm';
import { sliceTablePage, tablePageCount } from '../../financial-ui/table-slice';
import {
  autoMatchStatement,
  confirmReconciliation,
  getBankStatement,
  importBankFile,
  matchBankStatementLine,
  unreconcileReconciliation,
} from '../api/finance-api';
import { mapFinanceErrorToMessage } from '../api/finance-error-messages';
import { FinanceStatusBadge } from '../components/FinanceStatusBadge';
import type { AutoMatchResult, BankStatement, ReconciliationMatch } from '../types/finance.types';

type PageState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'denied' }
  | { phase: 'error'; message: string; retryable: boolean; conflict: boolean }
  | { phase: 'ready'; statement: BankStatement; autoMatch?: AutoMatchResult };

const RECONCILIATION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  CONFIRMED: 'Confirmada',
  UNRECONCILED: 'Desfeita',
};

function errorInfo(error: unknown): { message: string; retryable: boolean; conflict: boolean } {
  if (error instanceof BackofficeApiError) {
    return {
      message: mapFinanceErrorToMessage(error.code, error.status),
      retryable: error.kind === 'network' || error.kind === 'unknown',
      conflict: error.kind === 'version_conflict' || error.kind === 'closed_period',
    };
  }
  return { message: mapFinanceErrorToMessage(undefined, 0), retryable: true, conflict: false };
}

export function BankReconciliationPage() {
  const [statementId, setStatementId] = useState('');
  const [state, setState] = useState<PageState>({ phase: 'idle' });
  const [pageNumber, setPageNumber] = useState(1);
  const [actionError, setActionError] = useState<{ message: string; conflict: boolean } | null>(null);
  const [importFields, setImportFields] = useState({
    unitId: '',
    financialAccountId: '',
    fileName: 'extrato.json',
    content: '',
  });
  const [manualMatch, setManualMatch] = useState({ lineId: '', transactionId: '' });
  const [trackedReconciliations, setTrackedReconciliations] = useState<ReconciliationMatch[]>([]);
  const [selectedReconciliationId, setSelectedReconciliationId] = useState('');
  const [processing, setProcessing] = useState(false);
  const inflight = useRef(false);
  const idempotencyKey = useRef(createIdempotencyKey());

  const clearActionError = useCallback(() => setActionError(null), []);

  const loadStatement = useCallback(
    async (id: string, signal?: AbortSignal) => {
      setState({ phase: 'loading' });
      setActionError(null);
      setTrackedReconciliations([]);
      setSelectedReconciliationId('');
      try {
        const statement = await getBankStatement(id, signal);
        setPageNumber(1);
        setState({ phase: 'ready', statement });
      } catch (error) {
        if (error instanceof BackofficeApiError && error.kind === 'denied') {
          setState({ phase: 'denied' });
          return;
        }
        setState({ phase: 'error', ...errorInfo(error) });
      }
    },
    [],
  );

  async function handleImport() {
    if (inflight.current) {
      return;
    }
    inflight.current = true;
    setProcessing(true);
    setActionError(null);
    try {
      const statement = await importBankFile({
        ...importFields,
        idempotencyKey: idempotencyKey.current,
      });
      idempotencyKey.current = createIdempotencyKey();
      setStatementId(statement.id);
      setTrackedReconciliations([]);
      setSelectedReconciliationId('');
      setPageNumber(1);
      setState({ phase: 'ready', statement });
    } catch (error) {
      const failure = errorInfo(error);
      // A falha da importação nunca apaga um extrato já carregado.
      if (state.phase === 'ready') {
        setActionError({ message: failure.message, conflict: failure.conflict });
      } else {
        setState({ phase: 'error', ...failure });
      }
    } finally {
      inflight.current = false;
      setProcessing(false);
    }
  }

  function registerReconciliations(matches: ReconciliationMatch[]) {
    setTrackedReconciliations((current) => {
      const next = [...current];
      for (const match of matches) {
        const existingIndex = next.findIndex((item) => item.id === match.id);
        if (existingIndex >= 0) {
          next[existingIndex] = match;
        } else {
          next.push(match);
        }
      }
      return next;
    });
  }

  async function handleAutoMatch() {
    if (state.phase !== 'ready' || inflight.current) {
      return;
    }
    inflight.current = true;
    setProcessing(true);
    setActionError(null);
    const statement = state.statement;
    try {
      const autoMatch = await autoMatchStatement(statement.id);
      const reloaded = await getBankStatement(statement.id);
      registerReconciliations(autoMatch.suggested);
      setState({ phase: 'ready', statement: reloaded, autoMatch });
    } catch (error) {
      // Falha do auto-match mantém o extrato carregado e mostra o erro inline.
      const failure = errorInfo(error);
      setActionError({ message: failure.message, conflict: failure.conflict });
    } finally {
      inflight.current = false;
      setProcessing(false);
    }
  }

  async function handleManualMatch() {
    if (inflight.current || !manualMatch.lineId || !manualMatch.transactionId.trim()) {
      return;
    }
    inflight.current = true;
    setProcessing(true);
    setActionError(null);
    try {
      const created = await matchBankStatementLine({
        bankStatementLineId: manualMatch.lineId,
        financialTransactionId: manualMatch.transactionId.trim(),
      });
      setManualMatch({ lineId: '', transactionId: '' });
      setSelectedReconciliationId(created.id);
      registerReconciliations([created]);
      if (state.phase === 'ready') {
        const reloaded = await getBankStatement(state.statement.id);
        setState({ phase: 'ready', statement: reloaded });
      }
    } catch (error) {
      const failure = errorInfo(error);
      setActionError({ message: failure.message, conflict: failure.conflict });
    } finally {
      inflight.current = false;
      setProcessing(false);
    }
  }

  async function handleConfirm() {
    if (!selectedReconciliationId || inflight.current) {
      return;
    }
    const confirmed = await confirmReconciliation(selectedReconciliationId);
    registerReconciliations([confirmed]);
    if (state.phase === 'ready') {
      const reloaded = await getBankStatement(state.statement.id);
      setState({ phase: 'ready', statement: reloaded });
    }
  }

  async function handleUnreconcile() {
    if (!selectedReconciliationId || inflight.current) {
      return;
    }
    const unreconciled = await unreconcileReconciliation(selectedReconciliationId);
    registerReconciliations([unreconciled]);
    if (state.phase === 'ready') {
      const reloaded = await getBankStatement(state.statement.id);
      setState({ phase: 'ready', statement: reloaded });
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
  const selectedReconciliation = trackedReconciliations.find(
    (item) => item.id === selectedReconciliationId,
  );

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

      {statement ? (
        <FilterCard>
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Vínculo manual</h2>
          <p className="mb-4 text-sm text-gray-500">
            O servidor exige correspondência exata (conta, valor, direção e data) entre a linha e o movimento.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Linha do extrato" htmlFor="match-line" required>
              <Select
                id="match-line"
                className={filterControlClass}
                value={manualMatch.lineId}
                onChange={(event) => setManualMatch((current) => ({ ...current, lineId: event.target.value }))}
                disabled={lines.length === 0}
                required
              >
                <option value="">Selecione…</option>
                {lines
                  .filter((line) => line.matchStatus !== 'MATCHED')
                  .map((line) => (
                    <option key={line.id} value={line.id}>
                      Linha {line.lineNumber} · {line.description}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Identificador do movimento financeiro" htmlFor="match-transaction" required>
              <Input
                id="match-transaction"
                className={filterControlClass}
                value={manualMatch.transactionId}
                onChange={(event) =>
                  setManualMatch((current) => ({ ...current, transactionId: event.target.value }))
                }
                required
              />
            </Field>
          </div>
          <div className="mt-4">
            <Button type="button" onClick={() => void handleManualMatch()} loading={processing} disabled={processing}>
              Vincular manualmente
            </Button>
          </div>
        </FilterCard>
      ) : null}

      {processing ? (
        <div className="mb-4">
          <ProcessingBanner />
        </div>
      ) : null}

      {actionError ? (
        actionError.conflict ? (
          <div className="mb-4">
            <VersionConflictBanner
              message={actionError.message}
              onReload={() => (statement ? void loadStatement(statement.id) : undefined)}
            />
          </div>
        ) : (
          <p className="mb-4 text-sm text-red-700" role="alert">
            {actionError.message}
          </p>
        )
      ) : null}

      {state.phase === 'error' ? (
        state.conflict ? (
          <div className="mb-4">
            <VersionConflictBanner message={state.message} onReload={clearActionError} reloadLabel="Entendido" />
          </div>
        ) : (
          <p className="mb-4 text-sm text-red-700" role="alert">
            {state.message}
          </p>
        )
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

          <FilterCard>
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Confirmar ou desfazer conciliação</h2>
            {trackedReconciliations.length === 0 ? (
              <p className="text-sm text-gray-500">
                Nenhuma conciliação rastreada nesta sessão. Rode “Sugerir vínculos” ou faça um vínculo manual para
                confirmar.
              </p>
            ) : (
              <>
                <Field label="Conciliação" htmlFor="reconciliation-select">
                  <Select
                    id="reconciliation-select"
                    className={`${filterControlClass} max-w-xl`}
                    value={selectedReconciliationId}
                    onChange={(event) => setSelectedReconciliationId(event.target.value)}
                  >
                    <option value="">Selecione…</option>
                    {trackedReconciliations.map((reconciliation) => (
                      <option key={reconciliation.id} value={reconciliation.id}>
                        {reconciliation.id} · {RECONCILIATION_STATUS_LABELS[reconciliation.status] ?? reconciliation.status}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <VersionedActionForm
                    title="Confirmar conciliação"
                    description="Confirmação imutável: depois de confirmada só é revertida por desfazer autorizado."
                    confirmTitle="Confirmar conciliação"
                    confirmDescription="O backend valida que a conciliação ainda é rascunho."
                    confirmLabel="Confirmar"
                    disabled={!selectedReconciliation || selectedReconciliation.status !== 'DRAFT'}
                    mapError={mapFinanceErrorToMessage}
                    onReload={() => (statement ? void loadStatement(statement.id) : undefined)}
                    onSubmit={handleConfirm}
                  />
                  <VersionedActionForm
                    title="Desfazer conciliação"
                    description="Reverte uma conciliação confirmada para o estado anterior."
                    confirmTitle="Desfazer conciliação"
                    confirmDescription="Somente conciliações confirmadas podem ser desfeitas."
                    confirmLabel="Desfazer conciliação"
                    variant="danger"
                    disabled={!selectedReconciliation || selectedReconciliation.status !== 'CONFIRMED'}
                    mapError={mapFinanceErrorToMessage}
                    onReload={() => (statement ? void loadStatement(statement.id) : undefined)}
                    onSubmit={handleUnreconcile}
                  />
                </div>
              </>
            )}
          </FilterCard>

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
