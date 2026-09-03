import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DateTime, EmptyState, Money } from '../../ui';
import {
  ModulePage,
  ModulePageHeader,
  ModuleTableCard,
  moduleTableCellClass,
  moduleTableClass,
  moduleTableHeadClass,
  moduleTableHeaderCellClass,
  moduleTableRowClass,
} from '../../ui/module-layout';
import { ClosedPeriodBanner } from '../../financial-ui/ClosedPeriodBanner';
import { DefinitionList } from '../../financial-ui/DefinitionList';
import { JOURNAL_STATUS_LABELS, MOVEMENT_DIRECTION_LABELS } from '../../financial-ui/labels';
import { MoneyActionForm } from '../../financial-ui/MoneyActionForm';
import { RecordLookupCard } from '../../financial-ui/RecordLookupCard';
import { renderQueryGate } from '../../financial-ui/BackofficeStates';
import { useBackofficeQuery } from '../../financial-ui/useBackofficeQuery';
import { FinanceStatusBadge } from '../../finance/components/FinanceStatusBadge';
import { getJournal, postJournal, reverseJournal } from '../api/accounting-api';
import { mapAccountingErrorToMessage } from '../api/accounting-error-messages';
import type { JournalEntry } from '../types/accounting.types';

export function JournalsPage() {
  const { journalId } = useParams();
  const navigate = useNavigate();
  const [lookupId, setLookupId] = useState(journalId ?? '');
  const loader = useCallback((signal?: AbortSignal) => getJournal(journalId ?? '', signal), [journalId]);
  const { state, reload, setReady } = useBackofficeQuery<JournalEntry>({
    loader,
    mapError: mapAccountingErrorToMessage,
    enabled: Boolean(journalId),
    autoLoad: Boolean(journalId),
  });

  const gate = journalId
    ? renderQueryGate(
        'Lançamentos',
        'Carregando lançamento…',
        'Você não tem permissão para consultar lançamentos.',
        state,
        () => void reload(),
      )
    : null;

  return (
    <ModulePage>
      <ModulePageHeader
        title="Lançamentos"
        description="Totais de débito e crédito são os persistidos pelo servidor. O navegador não rebalanceia o lançamento."
      />
      <RecordLookupCard
        fieldId="journal-id"
        label="Identificador do lançamento"
        value={lookupId}
        onChange={setLookupId}
        onSubmit={() => {
          void navigate(`/app/accounting/journals/${lookupId.trim()}`);
        }}
        submitLabel="Consultar"
        loading={state.phase === 'loading'}
      />
      {gate}
      {!journalId ? (
        <EmptyState
          title="Nenhum lançamento carregado"
          description="A API atual consulta o lançamento por identificador."
        />
      ) : null}
      {state.phase === 'error' && state.kind === 'closed_period' ? (
        <ClosedPeriodBanner message={state.message} />
      ) : null}
      {state.phase === 'ready' ? (
        <JournalView journal={state.data} onReload={reload} onReady={setReady} />
      ) : null}
    </ModulePage>
  );
}

function JournalView({
  journal,
  onReload,
  onReady,
}: {
  journal: JournalEntry;
  onReload: () => Promise<void>;
  onReady: (next: JournalEntry) => void;
}) {
  return (
    <>
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <DefinitionList
          items={[
            {
              label: 'Status',
              value: <FinanceStatusBadge status={journal.status} labels={JOURNAL_STATUS_LABELS} />,
            },
            { label: 'Competência', value: <DateTime value={journal.occurredOn} mode="date" /> },
            { label: 'Descrição', value: journal.description },
            { label: 'Balanceado', value: journal.balanced ? 'Sim' : 'Não' },
            { label: 'Débitos', value: <Money value={journal.debitTotal} currencyCode={journal.currencyCode} /> },
            { label: 'Créditos', value: <Money value={journal.creditTotal} currencyCode={journal.currencyCode} /> },
            { label: 'Versão', value: String(journal.rowVersion) },
            { label: 'Origem', value: journal.sourceReference },
          ]}
        />
      </div>
      <ModuleTableCard>
        <table className={moduleTableClass} aria-label="Linhas do lançamento">
          <thead className={moduleTableHeadClass}>
            <tr>
              <th scope="col" className={moduleTableHeaderCellClass}>
                Linha
              </th>
              <th scope="col" className={moduleTableHeaderCellClass}>
                Conta
              </th>
              <th scope="col" className={moduleTableHeaderCellClass}>
                Direção
              </th>
              <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            {journal.lines.map((line) => (
              <tr key={line.id} className={moduleTableRowClass}>
                <td className={moduleTableCellClass}>{line.lineNumber}</td>
                <td className={`${moduleTableCellClass} font-mono`}>{line.accountId}</td>
                <td className={moduleTableCellClass}>
                  {MOVEMENT_DIRECTION_LABELS[line.direction] ?? line.direction}
                </td>
                <td className={`${moduleTableCellClass} text-right`}>
                  <Money value={line.amount} currencyCode={journal.currencyCode} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ModuleTableCard>
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MoneyActionForm
          title="Postar lançamento"
          description="A postagem é recusada se o período estiver fechado ou o lançamento desbalanceado."
          confirmTitle="Postar lançamento"
          confirmDescription="O servidor valida período, versão e partidas dobradas."
          confirmLabel="Postar"
          disabled={journal.status !== 'DRAFT'}
          mapError={mapAccountingErrorToMessage}
          onReload={() => void onReload()}
          onSubmit={async () => {
            onReady(await postJournal(journal.id, { rowVersion: journal.rowVersion }));
          }}
        />
        <MoneyActionForm
          title="Estornar lançamento"
          description="O estorno gera o lançamento inverso no servidor."
          confirmTitle="Estornar lançamento"
          confirmDescription="Somente o backend decide se o estorno é permitido."
          confirmLabel="Estornar"
          reasonLabel="Justificativa"
          disabled={journal.status !== 'POSTED'}
          mapError={mapAccountingErrorToMessage}
          onReload={() => void onReload()}
          onSubmit={async ({ reason }) => {
            onReady(await reverseJournal(journal.id, { rowVersion: journal.rowVersion, reason: reason ?? '' }));
          }}
        />
      </div>
    </>
  );
}
