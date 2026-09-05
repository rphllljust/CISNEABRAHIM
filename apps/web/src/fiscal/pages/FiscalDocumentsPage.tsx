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
import { DefinitionList } from '../../financial-ui/DefinitionList';
import { MoneyActionForm } from '../../financial-ui/MoneyActionForm';
import { FISCAL_STATUS_LABELS } from '../../financial-ui/labels';
import { RecordLookupCard } from '../../financial-ui/RecordLookupCard';
import { renderQueryGate } from '../../financial-ui/BackofficeStates';
import { useBackofficeQuery } from '../../financial-ui/useBackofficeQuery';
import { cancelFiscalDocument, getFiscalDocument, submitFiscalDocument } from '../api/fiscal-api';
import { mapFiscalErrorToMessage } from '../api/fiscal-error-messages';
import { FinanceStatusBadge } from '../../finance/components/FinanceStatusBadge';
import type { FiscalDocument } from '../types/fiscal.types';

export function FiscalDocumentsPage() {
  const { fiscalDocumentId } = useParams();
  const navigate = useNavigate();
  const [lookupId, setLookupId] = useState(fiscalDocumentId ?? '');
  const loader = useCallback(
    (signal?: AbortSignal) => getFiscalDocument(fiscalDocumentId ?? '', signal),
    [fiscalDocumentId],
  );
  const { state, reload, setReady } = useBackofficeQuery<FiscalDocument>({
    loader,
    mapError: mapFiscalErrorToMessage,
    enabled: Boolean(fiscalDocumentId),
    autoLoad: Boolean(fiscalDocumentId),
  });

  const gate = fiscalDocumentId
    ? renderQueryGate(
        'Documentos fiscais',
        'Carregando documento fiscal…',
        'Você não tem permissão para ver documentos fiscais.',
        state,
        () => void reload(),
      )
    : null;

  return (
    <ModulePage>
      <ModulePageHeader
        title="Documentos fiscais"
        description="Consulta e transições usam o documento oficial do servidor. Tributos da tela vêm do snapshot persistido."
      />
      <RecordLookupCard
        fieldId="fiscal-document-id"
        label="Identificador do documento"
        value={lookupId}
        onChange={setLookupId}
        onSubmit={() => {
          void navigate(`/app/fiscal/documents/${lookupId.trim()}`);
        }}
        submitLabel="Consultar"
        loading={state.phase === 'loading'}
      />
      {gate}
      {!fiscalDocumentId && state.phase === 'idle' ? (
        <EmptyState
          title="Nenhum documento carregado"
          description="A API fiscal atual não lista documentos. Consulte pelo identificador devolvido pelo servidor."
        />
      ) : null}
      {state.phase === 'ready' ? <FiscalDocumentView document={state.data} onReload={reload} onReady={setReady} /> : null}
    </ModulePage>
  );
}

function FiscalDocumentView({
  document,
  onReload,
  onReady,
}: {
  document: FiscalDocument;
  onReload: () => Promise<void>;
  onReady: (next: FiscalDocument) => void;
}) {
  const immutable = document.status === 'AUTHORIZED' || document.status === 'CANCELLED';

  return (
    <>
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <DefinitionList
          items={[
            {
              label: 'Status',
              value: <FinanceStatusBadge status={document.status} labels={FISCAL_STATUS_LABELS} />,
            },
            { label: 'Descrição', value: document.description },
            { label: 'Emissão', value: <DateTime value={document.issuedOn} mode="date" /> },
            { label: 'Versão', value: String(document.rowVersion) },
            { label: 'Origem', value: document.sourceKind },
            { label: 'Faturamento', value: document.billingDocumentId ?? '—' },
            { label: 'Validade fiscal', value: document.validityLegend || 'SEM VALIDADE FISCAL' },
            { label: 'DANFE oficial', value: document.officialDanfe === 'ALLOWED' ? 'Liberada' : 'Bloqueada' },
          ]}
        />
      </div>

      <ModuleTableCard>
        <table className={moduleTableClass} aria-label="Itens do documento fiscal">
          <thead className={moduleTableHeadClass}>
            <tr>
              <th scope="col" className={moduleTableHeaderCellClass}>
                Item
              </th>
              <th scope="col" className={moduleTableHeaderCellClass}>
                Descrição
              </th>
              <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>
                Quantidade
              </th>
              <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>
                Valor da linha
              </th>
            </tr>
          </thead>
          <tbody>
            {document.items.map((item) => (
              <tr key={item.lineNumber} className={moduleTableRowClass}>
                <td className={moduleTableCellClass}>{item.lineNumber}</td>
                <td className={`${moduleTableCellClass} whitespace-normal`}>{item.description}</td>
                <td className={`${moduleTableCellClass} text-right`}>{item.quantity}</td>
                <td className={`${moduleTableCellClass} text-right`}>
                  <Money value={item.lineAmount} currencyCode={document.currencyCode} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ModuleTableCard>

      <ModuleTableCard>
        <table className={moduleTableClass} aria-label="Tributos persistidos no documento">
          <thead className={moduleTableHeadClass}>
            <tr>
              <th scope="col" className={moduleTableHeaderCellClass}>
                Componente
              </th>
              <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            {document.taxDetails.map((detail, index) => (
              <tr key={`${detail.lineNumber}-${detail.componentLabel}-${index}`} className={moduleTableRowClass}>
                <td className={moduleTableCellClass}>
                  {detail.componentLabel} · linha {detail.lineNumber}
                </td>
                <td className={`${moduleTableCellClass} text-right`}>
                  <Money value={detail.amount} currencyCode={document.currencyCode} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ModuleTableCard>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MoneyActionForm
          title="Enviar documento"
          description="A submissão e a autorização são decididas pelo backend."
          confirmTitle="Enviar documento fiscal"
          confirmDescription="O servidor aplicará a transição e o gateway configurado."
          confirmLabel="Enviar"
          disabled={immutable}
          mapError={mapFiscalErrorToMessage}
          onReload={() => void onReload()}
          onSubmit={async () => {
            onReady(await submitFiscalDocument(document.id, { rowVersion: document.rowVersion }));
          }}
        />
        <MoneyActionForm
          title="Cancelar documento"
          description="O cancelamento oficial exige justificativa e versão atual."
          confirmTitle="Cancelar documento fiscal"
          confirmDescription="Somente o backend autoriza o cancelamento."
          confirmLabel="Cancelar documento"
          reasonLabel="Justificativa"
          disabled={document.status === 'CANCELLED'}
          mapError={mapFiscalErrorToMessage}
          onReload={() => void onReload()}
          onSubmit={async ({ reason }) => {
            onReady(
              await cancelFiscalDocument(document.id, {
                rowVersion: document.rowVersion,
                reason: reason ?? '',
              }),
            );
          }}
        />
      </div>
    </>
  );
}
