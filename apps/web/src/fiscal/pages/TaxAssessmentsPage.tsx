import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EmptyState, Field, Input, Money } from '../../ui';
import { ModulePage, ModulePageHeader } from '../../ui/module-layout';
import { DefinitionList } from '../../financial-ui/DefinitionList';
import { CreateRecordForm, VersionedActionForm } from '../../financial-ui/VersionedActionForm';
import { TAX_ASSESSMENT_STATUS_LABELS } from '../../financial-ui/labels';
import { RecordLookupCard } from '../../financial-ui/RecordLookupCard';
import { renderQueryGate } from '../../financial-ui/BackofficeStates';
import { useBackofficeQuery } from '../../financial-ui/useBackofficeQuery';
import {
  adjustTaxAssessment,
  cancelTaxAssessment,
  createTaxAssessment,
  finalizeTaxAssessment,
  getTaxAssessment,
} from '../api/fiscal-api';
import { mapFiscalErrorToMessage } from '../api/fiscal-error-messages';
import { FinanceStatusBadge } from '../../finance/components/FinanceStatusBadge';
import type { TaxAssessment } from '../types/fiscal.types';

export function TaxAssessmentsPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [lookupId, setLookupId] = useState(assessmentId ?? '');
  const [taxCalculationId, setTaxCalculationId] = useState('');
  const [counterpartyId, setCounterpartyId] = useState('');
  const [expenseCategoryId, setExpenseCategoryId] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [costCenterCode, setCostCenterCode] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const loader = useCallback(
    (signal?: AbortSignal) => getTaxAssessment(assessmentId ?? '', signal),
    [assessmentId],
  );
  const { state, reload, setReady } = useBackofficeQuery<TaxAssessment>({
    loader,
    mapError: mapFiscalErrorToMessage,
    enabled: Boolean(assessmentId),
    autoLoad: Boolean(assessmentId),
  });
  const gate = assessmentId
    ? renderQueryGate(
        'Obrigações tributárias',
        'Carregando obrigação…',
        'Você não tem permissão para ver obrigações tributárias.',
        state,
        () => void reload(),
      )
    : null;

  return (
    <ModulePage>
      <ModulePageHeader
        title="Obrigações tributárias"
        description="O valor apurado vem da apuração persistida. Esta tela não calcula imposto."
      />
      <RecordLookupCard
        fieldId="tax-assessment-id"
        label="Identificador da obrigação"
        value={lookupId}
        onChange={setLookupId}
        onSubmit={() => void navigate(`/app/fiscal/assessments/${lookupId.trim()}`)}
        submitLabel="Consultar"
        loading={state.phase === 'loading'}
      />
      <CreateRecordForm
        title="Criar obrigação a partir da apuração"
        description="Informe o identificador da apuração já persistida."
        submitLabel="Criar obrigação"
        mapError={mapFiscalErrorToMessage}
        onSubmit={async (idempotencyKey) => {
          const created = await createTaxAssessment({
            taxCalculationId: taxCalculationId.trim(),
            idempotencyKey,
          });
          void navigate(`/app/fiscal/assessments/${created.id}`);
        }}
      >
        <Field label="Apuração" htmlFor="assessment-calc" required className="md:col-span-2">
          <Input
            id="assessment-calc"
            value={taxCalculationId}
            onChange={(event) => setTaxCalculationId(event.target.value)}
            required
          />
        </Field>
      </CreateRecordForm>
      {gate}
      {!assessmentId ? (
        <EmptyState title="Nenhuma obrigação carregada" description="Consulte pelo identificador do servidor." />
      ) : null}
      {state.phase === 'ready' ? (
        <>
          <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
            <DefinitionList
              items={[
                {
                  label: 'Status',
                  value: (
                    <FinanceStatusBadge status={state.data.status} labels={TAX_ASSESSMENT_STATUS_LABELS} />
                  ),
                },
                {
                  label: 'Valor apurado',
                  value: <Money value={state.data.assessedAmount} currencyCode={state.data.currencyCode} emphasis />,
                },
                { label: 'Competência', value: state.data.periodKey },
                { label: 'Pagável', value: state.data.obligation?.payableId ?? '—' },
                { label: 'Versão', value: String(state.data.rowVersion) },
              ]}
            />
          </div>
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CreateRecordForm
              title="Finalizar"
              description="Gera o título a pagar no backend. Finalize é passo separado do ajuste."
              submitLabel="Finalizar"
              mapError={mapFiscalErrorToMessage}
              onSubmit={async () => {
                setReady(
                  await finalizeTaxAssessment(state.data.id, {
                    counterpartyId: counterpartyId.trim(),
                    expenseCategoryId: expenseCategoryId.trim(),
                    costCenterId: costCenterId.trim(),
                    costCenterCode: costCenterCode.trim(),
                    dueDate: dueDate.trim(),
                    paymentTerms: paymentTerms.trim(),
                  }),
                );
              }}
            >
              <Field label="Contraparte" htmlFor="finalize-counterparty" required>
                <Input id="finalize-counterparty" value={counterpartyId} onChange={(event) => setCounterpartyId(event.target.value)} required />
              </Field>
              <Field label="Categoria" htmlFor="finalize-category" required>
                <Input id="finalize-category" value={expenseCategoryId} onChange={(event) => setExpenseCategoryId(event.target.value)} required />
              </Field>
              <Field label="Centro de custo (id)" htmlFor="finalize-cc-id" required>
                <Input id="finalize-cc-id" value={costCenterId} onChange={(event) => setCostCenterId(event.target.value)} required />
              </Field>
              <Field label="Centro de custo (código)" htmlFor="finalize-cc-code" required>
                <Input id="finalize-cc-code" value={costCenterCode} onChange={(event) => setCostCenterCode(event.target.value)} required />
              </Field>
              <Field label="Vencimento" htmlFor="finalize-due" required>
                <Input id="finalize-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required />
              </Field>
              <Field label="Condição" htmlFor="finalize-terms" required>
                <Input id="finalize-terms" value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} required />
              </Field>
            </CreateRecordForm>
            <VersionedActionForm
              title="Cancelar"
              description="Cancelamento exige justificativa."
              confirmTitle="Cancelar obrigação"
              confirmDescription="O servidor recusa cancelamento indevido."
              confirmLabel="Cancelar"
              variant="danger"
              reasonLabel="Motivo"
              mapError={mapFiscalErrorToMessage}
              onReload={() => void reload()}
              onSubmit={async ({ reason }) =>
                setReady(await cancelTaxAssessment(state.data.id, { reason: reason ?? '' }))
              }
            />
          </div>
          <CreateRecordForm
            title="Ajustar"
            description="O ajuste cria sucessor em rascunho. Finalize é um passo separado do checker."
            submitLabel="Ajustar"
            mapError={mapFiscalErrorToMessage}
            onSubmit={async (idempotencyKey) => {
              const next = await adjustTaxAssessment(state.data.id, {
                taxCalculationId: taxCalculationId.trim() || state.data.taxCalculationId,
                idempotencyKey,
                reason: 'ajuste',
                counterpartyId: counterpartyId.trim(),
                expenseCategoryId: expenseCategoryId.trim(),
                costCenterId: costCenterId.trim(),
                costCenterCode: costCenterCode.trim(),
                dueDate: dueDate.trim(),
                paymentTerms: paymentTerms.trim(),
              });
              void navigate(`/app/fiscal/assessments/${next.id}`);
            }}
          >
            <Field label="Nova apuração (opcional)" htmlFor="adjust-calc" className="md:col-span-2">
              <Input id="adjust-calc" value={taxCalculationId} onChange={(event) => setTaxCalculationId(event.target.value)} />
            </Field>
          </CreateRecordForm>
        </>
      ) : null}
    </ModulePage>
  );
}
