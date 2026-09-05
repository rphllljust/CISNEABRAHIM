import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EmptyState, Field, Input } from '../../ui';
import { ModulePage, ModulePageHeader } from '../../ui/module-layout';
import { DefinitionList } from '../../financial-ui/DefinitionList';
import { CreateRecordForm, VersionedActionForm } from '../../financial-ui/VersionedActionForm';
import { PERIOD_STATUS_LABELS } from '../../financial-ui/labels';
import { RecordLookupCard } from '../../financial-ui/RecordLookupCard';
import { renderQueryGate } from '../../financial-ui/BackofficeStates';
import { useBackofficeQuery } from '../../financial-ui/useBackofficeQuery';
import { closeFiscalPeriod, getFiscalPeriod, openFiscalPeriod, reopenFiscalPeriod } from '../api/fiscal-api';
import { mapFiscalErrorToMessage } from '../api/fiscal-error-messages';
import { FinanceStatusBadge } from '../../finance/components/FinanceStatusBadge';
import type { FiscalPeriod } from '../types/fiscal.types';

export function FiscalPeriodsPage() {
  const { periodId } = useParams();
  const navigate = useNavigate();
  const [lookupId, setLookupId] = useState(periodId ?? '');
  const [unitId, setUnitId] = useState('');
  const [periodKey, setPeriodKey] = useState('');
  const loader = useCallback((signal?: AbortSignal) => getFiscalPeriod(periodId ?? '', signal), [periodId]);
  const { state, reload, setReady } = useBackofficeQuery<FiscalPeriod>({
    loader,
    mapError: mapFiscalErrorToMessage,
    enabled: Boolean(periodId),
    autoLoad: Boolean(periodId),
  });
  const gate = periodId
    ? renderQueryGate(
        'Períodos fiscais',
        'Carregando período fiscal…',
        'Você não tem permissão para ver períodos fiscais.',
        state,
        () => void reload(),
      )
    : null;

  return (
    <ModulePage>
      <ModulePageHeader
        title="Períodos fiscais"
        description="Abertura, fechamento e reabertura são decididos pelo backend."
      />
      <RecordLookupCard
        fieldId="fiscal-period-id"
        label="Identificador do período"
        value={lookupId}
        onChange={setLookupId}
        onSubmit={() => void navigate(`/app/fiscal/periods/${lookupId.trim()}`)}
        submitLabel="Consultar"
        loading={state.phase === 'loading'}
      />
      <CreateRecordForm
        title="Abrir período"
        description="A competência usa o formato AAAA-MM exigido pela API."
        submitLabel="Abrir período"
        mapError={mapFiscalErrorToMessage}
        onSubmit={async () => {
          const created = await openFiscalPeriod({ unitId: unitId.trim(), periodKey: periodKey.trim() });
          void navigate(`/app/fiscal/periods/${created.id}`);
        }}
      >
        <Field label="Unidade" htmlFor="fiscal-period-unit" required>
          <Input id="fiscal-period-unit" value={unitId} onChange={(event) => setUnitId(event.target.value)} required />
        </Field>
        <Field label="Competência" htmlFor="fiscal-period-key" required>
          <Input id="fiscal-period-key" value={periodKey} onChange={(event) => setPeriodKey(event.target.value)} required />
        </Field>
      </CreateRecordForm>
      {gate}
      {!periodId ? (
        <EmptyState title="Nenhum período carregado" description="Consulte pelo identificador do servidor." />
      ) : null}
      {state.phase === 'ready' ? (
        <>
          <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
            <DefinitionList
              items={[
                {
                  label: 'Status',
                  value: <FinanceStatusBadge status={state.data.status} labels={PERIOD_STATUS_LABELS} />,
                },
                { label: 'Competência', value: state.data.periodKey },
                { label: 'Versão', value: String(state.data.rowVersion) },
                { label: 'Motivo da reabertura', value: state.data.reopenReason ?? '—' },
              ]}
            />
          </div>
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <VersionedActionForm
              title="Fechar"
              description="Checagens de fechamento correm no servidor."
              confirmTitle="Fechar período fiscal"
              confirmDescription="O período só fecha se as checagens do backend passarem."
              confirmLabel="Fechar"
              mapError={mapFiscalErrorToMessage}
              onReload={() => void reload()}
              onSubmit={async () => setReady(await closeFiscalPeriod(state.data.id))}
            />
            <VersionedActionForm
              title="Reabrir"
              description="Reabertura exige justificativa e checker distinto."
              confirmTitle="Reabrir período fiscal"
              confirmDescription="O servidor aplica SOD e registra o motivo."
              confirmLabel="Reabrir"
              reasonLabel="Justificativa"
              mapError={mapFiscalErrorToMessage}
              onReload={() => void reload()}
              onSubmit={async ({ reason }) =>
                setReady(await reopenFiscalPeriod(state.data.id, { reason: reason ?? '' }))
              }
            />
          </div>
        </>
      ) : null}
    </ModulePage>
  );
}
