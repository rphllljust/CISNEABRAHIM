import { useCallback, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DateTime, EmptyState, Field, Input } from '../../ui';
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
import { SUPPLIER_STATUS_LABELS } from '../../financial-ui/labels';
import { RecordLookupCard } from '../../financial-ui/RecordLookupCard';
import { renderQueryGate } from '../../financial-ui/BackofficeStates';
import { useBackofficeQuery } from '../../financial-ui/useBackofficeQuery';
import { BackofficeCapabilityRoute } from '../../financial-ui/BackofficeCapabilityRoute';
import { FinanceStatusBadge } from '../../finance/components/FinanceStatusBadge';
import {
  activateSupplier,
  createSupplier,
  deactivateSupplier,
  getSupplier,
  getSupplierHistory,
  probeSupplierReadAccess,
  updateSupplier,
} from '../api/suppliers-api';
import { mapSupplierErrorToMessage } from '../api/supplier-error-messages';
import type { SupplierDetail, SupplierHistoryItem } from '../types/supplier.types';

export function SuppliersRoute({ children }: { children: ReactNode }) {
  return (
    <BackofficeCapabilityRoute probe={probeSupplierReadAccess} capabilityId="suppliers:supplier:read">
      {children}
    </BackofficeCapabilityRoute>
  );
}

export function SuppliersPage() {
  const { supplierId } = useParams();
  const navigate = useNavigate();
  const [lookupId, setLookupId] = useState(supplierId ?? '');
  const [legalName, setLegalName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const loader = useCallback((signal?: AbortSignal) => getSupplier(supplierId ?? '', signal), [supplierId]);
  const { state, reload, setReady } = useBackofficeQuery<SupplierDetail>({
    loader,
    mapError: mapSupplierErrorToMessage,
    enabled: Boolean(supplierId),
    autoLoad: Boolean(supplierId),
  });
  const historyLoader = useCallback(
    (signal?: AbortSignal) => getSupplierHistory(supplierId ?? '', signal),
    [supplierId],
  );
  const history = useBackofficeQuery<SupplierHistoryItem[]>({
    loader: historyLoader,
    mapError: mapSupplierErrorToMessage,
    enabled: Boolean(supplierId),
    autoLoad: Boolean(supplierId),
  });
  const gate = supplierId
    ? renderQueryGate(
        'Fornecedores',
        'Carregando fornecedor…',
        'Você não tem permissão para ver fornecedores.',
        state,
        () => void reload(),
      )
    : null;

  return (
    <ModulePage>
      <ModulePageHeader
        title="Fornecedores"
        description="A API atual consulta por identificador. Ativação segue SOD no backend."
      />
      <RecordLookupCard
        fieldId="supplier-id"
        label="Identificador do fornecedor"
        value={lookupId}
        onChange={setLookupId}
        onSubmit={() => void navigate(`/app/suppliers/${lookupId.trim()}`)}
        submitLabel="Consultar"
        loading={state.phase === 'loading'}
      />
      <CreateRecordForm
        title="Cadastrar fornecedor"
        description="CNPJ e contato operacional são validados pelo servidor."
        submitLabel="Cadastrar"
        mapError={mapSupplierErrorToMessage}
        onSubmit={async () => {
          const created = await createSupplier({
            legalName: legalName.trim(),
            taxId: taxId.trim(),
            contacts: [{ name: contactName.trim(), purpose: 'operational', email: contactEmail.trim() }],
          });
          void navigate(`/app/suppliers/${created.id}`);
        }}
      >
        <Field label="Razão social" htmlFor="supplier-legal" required>
          <Input id="supplier-legal" value={legalName} onChange={(event) => setLegalName(event.target.value)} required />
        </Field>
        <Field label="CNPJ" htmlFor="supplier-tax" required>
          <Input id="supplier-tax" value={taxId} onChange={(event) => setTaxId(event.target.value)} required />
        </Field>
        <Field label="Contato operacional" htmlFor="supplier-contact" required>
          <Input id="supplier-contact" value={contactName} onChange={(event) => setContactName(event.target.value)} required />
        </Field>
        <Field label="E-mail" htmlFor="supplier-email" required>
          <Input id="supplier-email" type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} required />
        </Field>
      </CreateRecordForm>
      {gate}
      {!supplierId ? (
        <EmptyState title="Nenhum fornecedor carregado" description="A listagem não existe nesta API. Consulte pelo identificador." />
      ) : null}
      {state.phase === 'ready' ? (
        <>
          <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
            <DefinitionList
              items={[
                {
                  label: 'Status',
                  value: <FinanceStatusBadge status={state.data.status} labels={SUPPLIER_STATUS_LABELS} />,
                },
                { label: 'Razão social', value: state.data.legalName },
                { label: 'CNPJ', value: state.data.taxId },
                { label: 'Versão', value: String(state.data.version) },
              ]}
            />
          </div>
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <VersionedActionForm
              title="Ativar"
              description="Ativação exige checker distinto no backend."
              confirmTitle="Ativar fornecedor"
              confirmDescription="A autoativação é recusada pela segregação de funções."
              confirmLabel="Ativar"
              disabled={state.data.status === 'ACTIVE'}
              mapError={mapSupplierErrorToMessage}
              onReload={() => void reload()}
              onSubmit={async () => setReady(await activateSupplier(state.data.id, { version: state.data.version }))}
            />
            <VersionedActionForm
              title="Inativar"
              description="Inativação exige versão atual e motivo."
              confirmTitle="Inativar fornecedor"
              confirmDescription="O servidor recusa conflito de versão."
              confirmLabel="Inativar"
              variant="danger"
              reasonLabel="Motivo"
              disabled={state.data.status !== 'ACTIVE'}
              mapError={mapSupplierErrorToMessage}
              onReload={() => void reload()}
              onSubmit={async ({ reason }) =>
                setReady(await deactivateSupplier(state.data.id, { version: state.data.version, reason }))
              }
            />
          </div>
          <CreateRecordForm
            title="Atualizar cadastro"
            description="A alteração exige a versão atual. CNPJ não é alterado nesta tela."
            submitLabel="Salvar"
            mapError={mapSupplierErrorToMessage}
            onSubmit={async () => {
              setReady(
                await updateSupplier(state.data.id, {
                  version: state.data.version,
                  legalName: legalName.trim() || state.data.legalName,
                  contacts: [
                    {
                      name: contactName.trim() || state.data.contacts[0]?.name,
                      purpose: 'operational',
                      email: contactEmail.trim() || state.data.contacts[0]?.email,
                    },
                  ],
                }),
              );
            }}
          >
            <Field label="Razão social" htmlFor="supplier-update-legal" required className="md:col-span-2">
              <Input
                id="supplier-update-legal"
                value={legalName}
                onChange={(event) => setLegalName(event.target.value)}
                placeholder={state.data.legalName}
              />
            </Field>
          </CreateRecordForm>
          {history.state.phase === 'ready' && history.state.data.length > 0 ? (
            <ModuleTableCard>
              <table className={moduleTableClass} aria-label="Histórico do fornecedor">
                <thead className={moduleTableHeadClass}>
                  <tr>
                    <th scope="col" className={moduleTableHeaderCellClass}>Evento</th>
                    <th scope="col" className={moduleTableHeaderCellClass}>Quando</th>
                  </tr>
                </thead>
                <tbody>
                  {history.state.data.map((item) => (
                    <tr key={item.id} className={moduleTableRowClass}>
                      <td className={moduleTableCellClass}>{item.eventKind}</td>
                      <td className={moduleTableCellClass}>
                        <DateTime value={item.occurredAt} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ModuleTableCard>
          ) : null}
        </>
      ) : null}
    </ModulePage>
  );
}
