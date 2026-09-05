import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DateTime, EmptyState, Field, Input, Money } from '../../ui';
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
import { CreateRecordForm, VersionedActionForm } from '../../financial-ui/VersionedActionForm';
import { RecordLookupCard } from '../../financial-ui/RecordLookupCard';
import { renderQueryGate } from '../../financial-ui/BackofficeStates';
import { useBackofficeQuery } from '../../financial-ui/useBackofficeQuery';
import {
  acquireFixedAsset,
  depreciateFixedAsset,
  disposeFixedAsset,
  getFixedAsset,
  lookupFixedAsset,
  registerFixedAsset,
  reverseFixedAssetAcquisition,
  transferFixedAsset,
} from '../api/accounting-api';
import { mapAccountingErrorToMessage } from '../api/accounting-error-messages';
import type { FixedAssetRegister } from '../types/accounting.types';

export function FixedAssetsPage() {
  const { registerId } = useParams();
  const navigate = useNavigate();
  const [lookupId, setLookupId] = useState(registerId ?? '');
  const [unitId, setUnitId] = useState('');
  const [operationalAssetId, setOperationalAssetId] = useState('');
  const [usefulLifeMonths, setUsefulLifeMonths] = useState('');
  const [amount, setAmount] = useState('');
  const [occurredOn, setOccurredOn] = useState('');
  const [toCostCenterCode, setToCostCenterCode] = useState('');
  const [lookupUnitId, setLookupUnitId] = useState('');
  const [lookupOperationalId, setLookupOperationalId] = useState('');
  const loader = useCallback(
    (signal?: AbortSignal) => getFixedAsset(registerId ?? '', signal),
    [registerId],
  );
  const { state, reload, setReady } = useBackofficeQuery<FixedAssetRegister>({
    loader,
    mapError: mapAccountingErrorToMessage,
    enabled: Boolean(registerId),
    autoLoad: Boolean(registerId),
  });
  const gate = registerId
    ? renderQueryGate(
        'Ativo imobilizado',
        'Carregando registro contábil…',
        'Você não tem permissão para ver o ativo imobilizado.',
        state,
        () => void reload(),
      )
    : null;

  return (
    <ModulePage>
      <ModulePageHeader
        title="Ativo imobilizado"
        description="Valor contábil e depreciação são os persistidos pelo servidor."
      />
      <RecordLookupCard
        fieldId="fixed-asset-id"
        label="Identificador do registro"
        value={lookupId}
        onChange={setLookupId}
        onSubmit={() => void navigate(`/app/accounting/fixed-assets/${lookupId.trim()}`)}
        submitLabel="Consultar"
        loading={state.phase === 'loading'}
      />
      <CreateRecordForm
        title="Consultar por ativo operacional"
        description="A API devolve o registro contábil associado ao ativo físico."
        submitLabel="Consultar ativo operacional"
        mapError={mapAccountingErrorToMessage}
        onSubmit={async () => {
          const found = await lookupFixedAsset({
            unitId: lookupUnitId.trim(),
            operationalAssetId: lookupOperationalId.trim(),
          });
          void navigate(`/app/accounting/fixed-assets/${found.id}`);
        }}
      >
        <Field label="Unidade" htmlFor="fa-lookup-unit" required>
          <Input id="fa-lookup-unit" value={lookupUnitId} onChange={(event) => setLookupUnitId(event.target.value)} required />
        </Field>
        <Field label="Ativo operacional" htmlFor="fa-lookup-op" required>
          <Input
            id="fa-lookup-op"
            value={lookupOperationalId}
            onChange={(event) => setLookupOperationalId(event.target.value)}
            required
          />
        </Field>
      </CreateRecordForm>
      <CreateRecordForm
        title="Registrar ativo operacional"
        description="Associa um ativo físico já cadastrado ao livro de imobilizado."
        submitLabel="Registrar"
        mapError={mapAccountingErrorToMessage}
        onSubmit={async () => {
          const created = await registerFixedAsset({
            unitId: unitId.trim(),
            operationalAssetId: operationalAssetId.trim(),
            currencyCode: 'BRL',
            usefulLifeMonths: Number(usefulLifeMonths),
          });
          void navigate(`/app/accounting/fixed-assets/${created.id}`);
        }}
      >
        <Field label="Unidade" htmlFor="fa-unit" required>
          <Input id="fa-unit" value={unitId} onChange={(event) => setUnitId(event.target.value)} required />
        </Field>
        <Field label="Ativo operacional" htmlFor="fa-asset" required>
          <Input
            id="fa-asset"
            value={operationalAssetId}
            onChange={(event) => setOperationalAssetId(event.target.value)}
            required
          />
        </Field>
        <Field label="Vida útil (meses)" htmlFor="fa-life" required>
          <Input
            id="fa-life"
            inputMode="numeric"
            value={usefulLifeMonths}
            onChange={(event) => setUsefulLifeMonths(event.target.value)}
            required
          />
        </Field>
      </CreateRecordForm>
      {gate}
      {!registerId ? (
        <EmptyState title="Nenhum registro carregado" description="Consulte pelo identificador do servidor." />
      ) : null}
      {state.phase === 'ready' ? (
        <>
          <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
            <DefinitionList
              items={[
                { label: 'Status', value: state.data.status },
                {
                  label: 'Valor contábil',
                  value: <Money value={state.data.bookValue} currencyCode={state.data.currencyCode} emphasis />,
                },
                { label: 'Vida útil', value: `${state.data.usefulLifeMonths} meses` },
                { label: 'Aquisição', value: state.data.acquiredOn ?? '—' },
                { label: 'Baixa', value: state.data.disposedOn ?? '—' },
                { label: 'Versão', value: String(state.data.rowVersion) },
              ]}
            />
          </div>
          {state.data.movements.length === 0 ? (
            <EmptyState title="Sem movimentos" />
          ) : (
            <ModuleTableCard>
              <table className={moduleTableClass} aria-label="Movimentos do imobilizado">
                <thead className={moduleTableHeadClass}>
                  <tr>
                    <th scope="col" className={moduleTableHeaderCellClass}>Tipo</th>
                    <th scope="col" className={moduleTableHeaderCellClass}>Data</th>
                    <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {state.data.movements.map((item) => (
                    <tr key={item.id} className={moduleTableRowClass}>
                      <td className={moduleTableCellClass}>{item.kind}</td>
                      <td className={moduleTableCellClass}>
                        <DateTime value={item.occurredOn} mode="date" />
                      </td>
                      <td className={`${moduleTableCellClass} text-right`}>
                        <Money value={item.amount} currencyCode={state.data.currencyCode} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ModuleTableCard>
          )}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <CreateRecordForm
              title="Adquirir"
              description="O valor de aquisição é o informado ao servidor."
              submitLabel="Registrar aquisição"
              mapError={mapAccountingErrorToMessage}
              onSubmit={async (idempotencyKey) => {
                setReady(
                  await acquireFixedAsset(state.data.id, {
                    amount: amount.trim(),
                    occurredOn: occurredOn.trim(),
                    idempotencyKey,
                  }),
                );
              }}
            >
              <Field label="Valor" htmlFor="fa-amount" required>
                <Input id="fa-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required />
              </Field>
              <Field label="Data" htmlFor="fa-occurred" required>
                <Input id="fa-occurred" type="date" value={occurredOn} onChange={(event) => setOccurredOn(event.target.value)} required />
              </Field>
            </CreateRecordForm>
            <VersionedActionForm
              title="Depreciar"
              description="A depreciação é calculada pelo backend."
              confirmTitle="Lançar depreciação"
              confirmDescription="Nenhum valor é calculado neste formulário."
              confirmLabel="Depreciar"
              mapError={mapAccountingErrorToMessage}
              onReload={() => void reload()}
              onSubmit={async () => setReady(await depreciateFixedAsset(state.data.id))}
            />
            <CreateRecordForm
              title="Baixar"
              description="A baixa é recusada se o servidor não aceitar o estado atual."
              submitLabel="Baixar"
              mapError={mapAccountingErrorToMessage}
              onSubmit={async (idempotencyKey) => {
                setReady(
                  await disposeFixedAsset(state.data.id, {
                    occurredOn: occurredOn.trim(),
                    idempotencyKey,
                  }),
                );
              }}
            >
              <Field label="Data da baixa" htmlFor="fa-dispose-on" required>
                <Input id="fa-dispose-on" type="date" value={occurredOn} onChange={(event) => setOccurredOn(event.target.value)} required />
              </Field>
            </CreateRecordForm>
          </div>
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CreateRecordForm
              title="Transferir centro de custo"
              description="A transferência é persistida pelo servidor."
              submitLabel="Transferir"
              mapError={mapAccountingErrorToMessage}
              onSubmit={async (idempotencyKey) => {
                setReady(
                  await transferFixedAsset(state.data.id, {
                    toCostCenterCode: toCostCenterCode.trim(),
                    occurredOn: occurredOn.trim(),
                    idempotencyKey,
                  }),
                );
              }}
            >
              <Field label="Centro de custo destino" htmlFor="fa-transfer-cc" required>
                <Input
                  id="fa-transfer-cc"
                  value={toCostCenterCode}
                  onChange={(event) => setToCostCenterCode(event.target.value)}
                  required
                />
              </Field>
              <Field label="Data" htmlFor="fa-transfer-on" required>
                <Input
                  id="fa-transfer-on"
                  type="date"
                  value={occurredOn}
                  onChange={(event) => setOccurredOn(event.target.value)}
                  required
                />
              </Field>
            </CreateRecordForm>
            <VersionedActionForm
              title="Estornar aquisição"
              description="O estorno exige motivo e é recusado se o backend não aceitar."
              confirmTitle="Estornar aquisição"
              confirmDescription="Nenhum valor é recalculado neste formulário."
              confirmLabel="Estornar"
              variant="danger"
              reasonLabel="Motivo"
              mapError={mapAccountingErrorToMessage}
              onReload={() => void reload()}
              onSubmit={async ({ reason }) =>
                setReady(await reverseFixedAssetAcquisition(state.data.id, { reason: reason ?? '' }))
              }
            />
          </div>
        </>
      ) : null}
    </ModulePage>
  );
}
