import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EmptyState, Field, Input, Money } from '../../ui';
import {
  ModulePage,
  ModulePageHeader,
  ModulePrimaryLink,
  ModuleTableCard,
  moduleTableCellClass,
  moduleTableClass,
  moduleTableHeadClass,
  moduleTableHeaderCellClass,
  moduleTableRowClass,
} from '../../ui/module-layout';
import { DefinitionList } from '../../financial-ui/DefinitionList';
import { CreateRecordForm, VersionedActionForm } from '../../financial-ui/VersionedActionForm';
import { PROCUREMENT_REQUEST_STATUS_LABELS, SUPPLIER_INVOICE_STATUS_LABELS, SUPPLIER_PO_STATUS_LABELS } from '../../financial-ui/labels';
import { RecordLookupCard } from '../../financial-ui/RecordLookupCard';
import { renderQueryGate } from '../../financial-ui/BackofficeStates';
import { useBackofficeQuery } from '../../financial-ui/useBackofficeQuery';
import { BackofficeCapabilityRoute } from '../../financial-ui/BackofficeCapabilityRoute';
import { FinanceStatusBadge } from '../../finance/components/FinanceStatusBadge';
import {
  approvePurchaseRequest,
  cancelPurchaseOrder,
  cancelPurchaseRequest,
  computeThreeWayMatch,
  createPurchaseRequest,
  createSupplierInvoice,
  getPurchaseOrder,
  getPurchaseRequest,
  getSupplierInvoice,
  getThreeWayMatch,
  issuePurchaseOrder,
  probeProcurementReadAccess,
  receivePurchaseOrder,
  rejectPurchaseRequest,
  submitPurchaseRequest,
  validateSupplierInvoice,
  type PurchaseRequest,
  type SupplierInvoice,
  type SupplierPurchaseOrder,
  type ThreeWayMatch,
} from '../api/procurement-api';
import { mapProcurementErrorToMessage } from '../api/procurement-error-messages';
import {
  buildPartialReceive,
  defaultReceiveQuantities,
  remainingQuantity,
} from '../utils/partial-receive';

export function ProcurementRoute({ children }: { children: ReactNode }) {
  return (
    <BackofficeCapabilityRoute probe={probeProcurementReadAccess} capabilityId="procurement:request:read">
      {children}
    </BackofficeCapabilityRoute>
  );
}

export function ProcurementHubPage() {
  const navigate = useNavigate();
  const [requestLookup, setRequestLookup] = useState('');
  const [orderLookup, setOrderLookup] = useState('');
  const [invoiceLookup, setInvoiceLookup] = useState('');
  const [matchLookup, setMatchLookup] = useState('');
  const [unitId, setUnitId] = useState('');
  const [justification, setJustification] = useState('');
  const [lineDescription, setLineDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitAmount, setUnitAmount] = useState('');

  return (
    <ModulePage>
      <ModulePageHeader
        title="Compras"
        description="Solicitações e pedidos de fornecedor. Distinto do pedido de compra do cliente."
      />
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecordLookupCard
          title="Solicitação"
          fieldId="pr-id"
          label="Identificador da solicitação"
          value={requestLookup}
          onChange={setRequestLookup}
          onSubmit={() => void navigate(`/app/procurement/requests/${requestLookup.trim()}`)}
          submitLabel="Consultar"
        />
        <RecordLookupCard
          title="Pedido ao fornecedor"
          fieldId="spo-id"
          label="Identificador do pedido"
          value={orderLookup}
          onChange={setOrderLookup}
          onSubmit={() => void navigate(`/app/procurement/orders/${orderLookup.trim()}`)}
          submitLabel="Consultar"
        />
      </div>
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecordLookupCard
          title="Nota do fornecedor"
          fieldId="si-id"
          label="Identificador da nota"
          value={invoiceLookup}
          onChange={setInvoiceLookup}
          onSubmit={() => void navigate(`/app/procurement/invoices/${invoiceLookup.trim()}`)}
          submitLabel="Consultar"
        />
        <RecordLookupCard
          title="Conferência tripla"
          fieldId="twm-id"
          label="Identificador da conferência"
          value={matchLookup}
          onChange={setMatchLookup}
          onSubmit={() => void navigate(`/app/procurement/matches/${matchLookup.trim()}`)}
          submitLabel="Consultar"
        />
      </div>
      <CreateRecordForm
        title="Nova solicitação de compra"
        description="Quantidade × valor unitário é calculado pelo servidor."
        submitLabel="Criar solicitação"
        mapError={mapProcurementErrorToMessage}
        onSubmit={async () => {
          const created = await createPurchaseRequest({
            unitId: unitId.trim(),
            justification: justification.trim(),
            lines: [{ description: lineDescription.trim(), quantity: quantity.trim(), unitAmount: unitAmount.trim() }],
          });
          void navigate(`/app/procurement/requests/${created.id}`);
        }}
      >
        <Field label="Unidade" htmlFor="pr-unit" required>
          <Input id="pr-unit" value={unitId} onChange={(event) => setUnitId(event.target.value)} required />
        </Field>
        <Field label="Justificativa" htmlFor="pr-justification" required>
          <Input id="pr-justification" value={justification} onChange={(event) => setJustification(event.target.value)} required />
        </Field>
        <Field label="Item" htmlFor="pr-item" required>
          <Input id="pr-item" value={lineDescription} onChange={(event) => setLineDescription(event.target.value)} required />
        </Field>
        <Field label="Quantidade" htmlFor="pr-qty" required>
          <Input id="pr-qty" inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
        </Field>
        <Field label="Valor unitário" htmlFor="pr-amount" required>
          <Input id="pr-amount" inputMode="decimal" value={unitAmount} onChange={(event) => setUnitAmount(event.target.value)} required />
        </Field>
      </CreateRecordForm>
      <EmptyState
        title="Sem listagem nesta API"
        description="Consulte solicitação ou pedido pelo identificador, ou cadastre uma nova solicitação."
        action={<ModulePrimaryLink to="/app/suppliers">Fornecedores</ModulePrimaryLink>}
      />
    </ModulePage>
  );
}

export function PurchaseRequestPage() {
  const { requestId = '' } = useParams();
  const navigate = useNavigate();
  const [supplierId, setSupplierId] = useState('');
  const loader = useCallback((signal?: AbortSignal) => getPurchaseRequest(requestId, signal), [requestId]);
  const { state, reload, setReady } = useBackofficeQuery<PurchaseRequest>({
    loader,
    mapError: mapProcurementErrorToMessage,
    enabled: Boolean(requestId),
  });
  const gate = renderQueryGate(
    'Solicitação de compra',
    'Carregando solicitação…',
    'Você não tem permissão para ver esta solicitação.',
    state,
    () => void reload(),
  );
  if (gate) {
    return gate;
  }
  if (state.phase !== 'ready') {
    return (
      <ModulePage>
        <ModulePageHeader title="Solicitação de compra" />
        <EmptyState title="Informe um identificador válido" />
      </ModulePage>
    );
  }
  const item = state.data;
  return (
    <ModulePage>
      <ModulePageHeader title="Solicitação de compra" description={item.justification} />
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <DefinitionList
          items={[
            {
              label: 'Status',
              value: <FinanceStatusBadge status={item.status} labels={PROCUREMENT_REQUEST_STATUS_LABELS} />,
            },
            { label: 'Versão', value: String(item.version) },
            { label: 'Moeda', value: item.currencyCode },
          ]}
        />
      </div>
      <ModuleTableCard>
        <table className={moduleTableClass} aria-label="Linhas da solicitação">
          <thead className={moduleTableHeadClass}>
            <tr>
              <th scope="col" className={moduleTableHeaderCellClass}>Item</th>
              <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>Qtd</th>
              <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>Total informado</th>
            </tr>
          </thead>
          <tbody>
            {item.lines.map((line) => (
              <tr key={line.id} className={moduleTableRowClass}>
                <td className={moduleTableCellClass}>{line.description}</td>
                <td className={`${moduleTableCellClass} text-right`}>{line.quantity}</td>
                <td className={`${moduleTableCellClass} text-right`}>
                  <Money value={line.lineAmount} currencyCode={item.currencyCode} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ModuleTableCard>
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <VersionedActionForm
          title="Enviar"
          confirmTitle="Enviar solicitação"
          confirmDescription="O servidor valida o estado atual."
          confirmLabel="Enviar"
          description="Envia a solicitação para aprovação."
          disabled={item.status !== 'DRAFT'}
          mapError={mapProcurementErrorToMessage}
          onReload={() => void reload()}
          onSubmit={async () => setReady(await submitPurchaseRequest(item.id, { version: item.version }))}
        />
        <VersionedActionForm
          title="Aprovar"
          confirmTitle="Aprovar solicitação"
          confirmDescription="A autoaprovação é recusada pelo backend."
          confirmLabel="Aprovar"
          description="Aprovação segue SOD."
          disabled={item.status !== 'PENDING_APPROVAL'}
          mapError={mapProcurementErrorToMessage}
          onReload={() => void reload()}
          onSubmit={async () => setReady(await approvePurchaseRequest(item.id, { version: item.version }))}
        />
        <VersionedActionForm
          title="Rejeitar"
          confirmTitle="Rejeitar solicitação"
          confirmDescription="A rejeição exige versão atual."
          confirmLabel="Rejeitar"
          variant="danger"
          reasonLabel="Motivo"
          description="Justificativa enviada ao servidor."
          disabled={item.status !== 'PENDING_APPROVAL'}
          mapError={mapProcurementErrorToMessage}
          onReload={() => void reload()}
          onSubmit={async ({ reason }) =>
            setReady(await rejectPurchaseRequest(item.id, { version: item.version, reason }))
          }
        />
        <VersionedActionForm
          title="Cancelar"
          confirmTitle="Cancelar solicitação"
          confirmDescription="O cancelamento só ocorre se o backend aceitar o estado atual."
          confirmLabel="Cancelar"
          variant="danger"
          reasonLabel="Motivo"
          description="Cancelamento versionado no servidor."
          disabled={item.status === 'CANCELLED' || item.status === 'REJECTED'}
          mapError={mapProcurementErrorToMessage}
          onReload={() => void reload()}
          onSubmit={async ({ reason }) =>
            setReady(await cancelPurchaseRequest(item.id, { version: item.version, reason }))
          }
        />
        <CreateRecordForm
          title="Emitir pedido"
          description="Informe o fornecedor. O pedido é criado pelo servidor."
          submitLabel="Emitir pedido"
          disabled={item.status !== 'APPROVED'}
          mapError={mapProcurementErrorToMessage}
          onSubmit={async () => {
            const order = await issuePurchaseOrder(item.id, {
              version: item.version,
              supplierId: supplierId.trim(),
            });
            void navigate(`/app/procurement/orders/${order.id}`);
          }}
        >
          <Field label="Fornecedor" htmlFor="issue-supplier" required className="md:col-span-2">
            <Input id="issue-supplier" value={supplierId} onChange={(event) => setSupplierId(event.target.value)} required />
          </Field>
        </CreateRecordForm>
      </div>
    </ModulePage>
  );
}

export function PurchaseOrderPage() {
  const { orderId = '' } = useParams();
  const navigate = useNavigate();
  const [expenseCategoryId, setExpenseCategoryId] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [costCenterCode, setCostCenterCode] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [matchResult, setMatchResult] = useState<ThreeWayMatch | null>(null);
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, string>>({});
  const loader = useCallback((signal?: AbortSignal) => getPurchaseOrder(orderId, signal), [orderId]);
  const { state, reload, setReady } = useBackofficeQuery<SupplierPurchaseOrder>({
    loader,
    mapError: mapProcurementErrorToMessage,
    enabled: Boolean(orderId),
  });
  useEffect(() => {
    if (state.phase === 'ready') {
      setReceiveQuantities(defaultReceiveQuantities(state.data.lines));
    }
  }, [state]);
  const gate = renderQueryGate(
    'Pedido ao fornecedor',
    'Carregando pedido…',
    'Você não tem permissão para ver este pedido.',
    state,
    () => void reload(),
  );
  if (gate) {
    return gate;
  }
  if (state.phase !== 'ready') {
    return (
      <ModulePage>
        <ModulePageHeader title="Pedido ao fornecedor" />
        <EmptyState title="Informe um identificador válido" />
      </ModulePage>
    );
  }
  const order = state.data;
  const receiveResult = buildPartialReceive(order.lines, receiveQuantities);
  const receiveAllowed = order.status === 'ISSUED' || order.status === 'PARTIALLY_RECEIVED';
  return (
    <ModulePage>
      <ModulePageHeader title="Pedido ao fornecedor" />
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <DefinitionList
          items={[
            {
              label: 'Status',
              value: <FinanceStatusBadge status={order.status} labels={SUPPLIER_PO_STATUS_LABELS} />,
            },
            { label: 'Fornecedor', value: order.supplierId },
            { label: 'Versão', value: String(order.version) },
          ]}
        />
      </div>
      <ModuleTableCard>
        <table className={moduleTableClass} aria-label="Linhas do pedido">
          <thead className={moduleTableHeadClass}>
            <tr>
              <th scope="col" className={moduleTableHeaderCellClass}>Item</th>
              <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>Pedido</th>
              <th scope="col" className={`${moduleTableHeaderCellClass} text-right`}>Recebido</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => (
              <tr key={line.id} className={moduleTableRowClass}>
                <td className={moduleTableCellClass}>{line.description}</td>
                <td className={`${moduleTableCellClass} text-right`}>{line.orderedQuantity}</td>
                <td className={`${moduleTableCellClass} text-right`}>{line.receivedQuantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ModuleTableCard>
      {order.receipts.length > 0 ? (
        <ModuleTableCard>
          <table className={moduleTableClass} aria-label="Recebimentos do pedido">
            <thead className={moduleTableHeadClass}>
              <tr>
                <th scope="col" className={moduleTableHeaderCellClass}>Recebimento</th>
                <th scope="col" className={moduleTableHeaderCellClass}>Status</th>
                <th scope="col" className={moduleTableHeaderCellClass}>Título a pagar</th>
              </tr>
            </thead>
            <tbody>
              {order.receipts.map((receipt) => (
                <tr key={receipt.id} className={moduleTableRowClass}>
                  <td className={moduleTableCellClass}>{receipt.id}</td>
                  <td className={moduleTableCellClass}>{receipt.status}</td>
                  <td className={moduleTableCellClass}>{receipt.payableId ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ModuleTableCard>
      ) : null}
      <CreateRecordForm
        title="Receber"
        description="Informe por linha a quantidade a receber. O recebimento gera o título a pagar no backend."
        submitLabel="Registrar recebimento"
        disabled={!receiveAllowed || !receiveResult.valid}
        mapError={mapProcurementErrorToMessage}
        onSubmit={async (idempotencyKey) => {
          setReady(
            await receivePurchaseOrder(order.id, {
              version: order.version,
              idempotencyKey,
              expenseCategoryId: expenseCategoryId.trim(),
              costCenterId: costCenterId.trim(),
              costCenterCode: costCenterCode.trim(),
              dueDate: dueDate.trim(),
              lines: receiveResult.payload,
            }),
          );
        }}
      >
        <Field label="Categoria" htmlFor="recv-cat" required>
          <Input id="recv-cat" value={expenseCategoryId} onChange={(event) => setExpenseCategoryId(event.target.value)} required />
        </Field>
        <Field label="Centro de custo (id)" htmlFor="recv-cc-id" required>
          <Input id="recv-cc-id" value={costCenterId} onChange={(event) => setCostCenterId(event.target.value)} required />
        </Field>
        <Field label="Centro de custo (código)" htmlFor="recv-cc-code" required>
          <Input id="recv-cc-code" value={costCenterCode} onChange={(event) => setCostCenterCode(event.target.value)} required />
        </Field>
        <Field label="Vencimento" htmlFor="recv-due" required>
          <Input id="recv-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required />
        </Field>
        {order.lines.map((line) => {
          const remaining = remainingQuantity(line.orderedQuantity, line.receivedQuantity);
          return (
            <Field
              key={line.id}
              label="Quantidade a receber"
              htmlFor={`recv-qty-${line.id}`}
              hint={`${line.description} — pedido ${line.orderedQuantity}, recebido ${line.receivedQuantity}, saldo ${remaining}`}
              className="md:col-span-2"
            >
              <Input
                id={`recv-qty-${line.id}`}
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={receiveQuantities[line.id] ?? ''}
                onChange={(event) =>
                  setReceiveQuantities((current) => ({ ...current, [line.id]: event.target.value }))
                }
                disabled={remaining === '0'}
              />
            </Field>
          );
        })}
        {!receiveAllowed ? (
          <p className="text-sm text-amber-700 md:col-span-2" role="status">
            {order.status === 'RECEIVED'
              ? 'Pedido totalmente recebido; não há saldo a receber.'
              : 'O estado atual do pedido não permite recebimento.'}
          </p>
        ) : null}
        {receiveResult.issues.map((issue) => (
          <p key={issue} className="text-sm text-red-700 md:col-span-2" role="alert">
            {issue}
          </p>
        ))}
      </CreateRecordForm>
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <VersionedActionForm
          title="Conferência tripla"
          description="A classificação vem do servidor. Quantidades não são conferidas neste formulário."
          confirmTitle="Calcular conferência"
          confirmDescription="O backend compara pedido, recebimento e nota."
          confirmLabel="Calcular conferência"
          mapError={mapProcurementErrorToMessage}
          onReload={() => void reload()}
          onSubmit={async ({ idempotencyKey }) => {
            const match = await computeThreeWayMatch(order.id, { idempotencyKey });
            setMatchResult(match);
            void navigate(`/app/procurement/matches/${match.id}`);
          }}
        />
        <VersionedActionForm
          title="Cancelar pedido"
          description="Cancelamento versionado no servidor."
          confirmTitle="Cancelar pedido"
          confirmDescription="O pedido só cancela se o backend aceitar."
          confirmLabel="Cancelar"
          variant="danger"
          reasonLabel="Motivo"
          disabled={
            order.status === 'CANCELLED' ||
            order.status === 'RECEIVED' ||
            order.status === 'PARTIALLY_RECEIVED'
          }
          mapError={mapProcurementErrorToMessage}
          onReload={() => void reload()}
          onSubmit={async ({ reason }) =>
            setReady(await cancelPurchaseOrder(order.id, { version: order.version, reason }))
          }
        />
      </div>
      {matchResult ? (
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
          <DefinitionList
            items={[
              { label: 'Classificação', value: matchResult.classification },
              { label: 'Motivos', value: matchResult.reasons.join(', ') || '—' },
            ]}
          />
        </div>
      ) : null}
    </ModulePage>
  );
}

export function SupplierInvoicePage() {
  const { invoiceId = '' } = useParams();
  const navigate = useNavigate();
  const [lookupId, setLookupId] = useState(invoiceId);
  const [unitId, setUnitId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issuedOn, setIssuedOn] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [supplierPurchaseOrderId, setSupplierPurchaseOrderId] = useState('');
  const [expenseCategoryId, setExpenseCategoryId] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [costCenterCode, setCostCenterCode] = useState('');
  const loader = useCallback((signal?: AbortSignal) => getSupplierInvoice(invoiceId, signal), [invoiceId]);
  const { state, reload, setReady } = useBackofficeQuery<SupplierInvoice>({
    loader,
    mapError: mapProcurementErrorToMessage,
    enabled: Boolean(invoiceId),
    autoLoad: Boolean(invoiceId),
  });
  const gate = invoiceId
    ? renderQueryGate(
        'Nota do fornecedor',
        'Carregando nota…',
        'Você não tem permissão para ver notas de fornecedor.',
        state,
        () => void reload(),
      )
    : null;

  return (
    <ModulePage>
      <ModulePageHeader
        title="Nota do fornecedor"
        description="Validação e conferência são do servidor. Totais não são recalculados no navegador."
      />
      <RecordLookupCard
        fieldId="invoice-lookup"
        label="Identificador da nota"
        value={lookupId}
        onChange={setLookupId}
        onSubmit={() => void navigate(`/app/procurement/invoices/${lookupId.trim()}`)}
        submitLabel="Consultar"
        loading={state.phase === 'loading'}
      />
      <CreateRecordForm
        title="Registrar nota"
        description="Valores e datas são validados pela API."
        submitLabel="Registrar nota"
        mapError={mapProcurementErrorToMessage}
        onSubmit={async (idempotencyKey) => {
          const created = await createSupplierInvoice({
            unitId: unitId.trim(),
            supplierId: supplierId.trim(),
            invoiceNumber: invoiceNumber.trim(),
            issuedOn: issuedOn.trim(),
            dueDate: dueDate.trim(),
            totalAmount: totalAmount.trim(),
            paymentTerms: paymentTerms.trim(),
            supplierPurchaseOrderId: supplierPurchaseOrderId.trim() || undefined,
            idempotencyKey,
          });
          void navigate(`/app/procurement/invoices/${created.id}`);
        }}
      >
        <Field label="Unidade" htmlFor="si-unit" required>
          <Input id="si-unit" value={unitId} onChange={(event) => setUnitId(event.target.value)} required />
        </Field>
        <Field label="Fornecedor" htmlFor="si-supplier" required>
          <Input id="si-supplier" value={supplierId} onChange={(event) => setSupplierId(event.target.value)} required />
        </Field>
        <Field label="Número" htmlFor="si-number" required>
          <Input id="si-number" value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} required />
        </Field>
        <Field label="Emissão" htmlFor="si-issued" required>
          <Input id="si-issued" type="date" value={issuedOn} onChange={(event) => setIssuedOn(event.target.value)} required />
        </Field>
        <Field label="Vencimento" htmlFor="si-due" required>
          <Input id="si-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required />
        </Field>
        <Field label="Total informado" htmlFor="si-total" required>
          <Input
            id="si-total"
            inputMode="decimal"
            value={totalAmount}
            onChange={(event) => setTotalAmount(event.target.value)}
            required
          />
        </Field>
        <Field label="Condição de pagamento" htmlFor="si-terms" required>
          <Input id="si-terms" value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} required />
        </Field>
        <Field label="Pedido ao fornecedor" htmlFor="si-po">
          <Input
            id="si-po"
            value={supplierPurchaseOrderId}
            onChange={(event) => setSupplierPurchaseOrderId(event.target.value)}
          />
        </Field>
      </CreateRecordForm>
      {gate}
      {!invoiceId ? (
        <EmptyState title="Nenhuma nota carregada" description="A API atual consulta a nota por identificador." />
      ) : null}
      {state.phase === 'ready' ? (
        <>
          <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
            <DefinitionList
              items={[
                {
                  label: 'Status',
                  value: (
                    <FinanceStatusBadge status={state.data.status} labels={SUPPLIER_INVOICE_STATUS_LABELS} />
                  ),
                },
                {
                  label: 'Total informado',
                  value: <Money value={state.data.totalAmount} currencyCode={state.data.currencyCode} emphasis />,
                },
                { label: 'Número', value: state.data.invoiceNumber },
                { label: 'Título a pagar', value: state.data.payableId ?? '—' },
                { label: 'Versão', value: String(state.data.version) },
              ]}
            />
          </div>
          <CreateRecordForm
            title="Validar nota"
            description="A validação gera o título a pagar no backend."
            submitLabel="Validar"
            disabled={state.data.status !== 'DRAFT'}
            mapError={mapProcurementErrorToMessage}
            onSubmit={async () => {
              setReady(
                await validateSupplierInvoice(state.data.id, {
                  version: state.data.version,
                  expenseCategoryId: expenseCategoryId.trim(),
                  costCenterId: costCenterId.trim(),
                  costCenterCode: costCenterCode.trim(),
                }),
              );
            }}
          >
            <Field label="Categoria" htmlFor="si-cat" required>
              <Input
                id="si-cat"
                value={expenseCategoryId}
                onChange={(event) => setExpenseCategoryId(event.target.value)}
                required
              />
            </Field>
            <Field label="Centro de custo (id)" htmlFor="si-cc-id" required>
              <Input
                id="si-cc-id"
                value={costCenterId}
                onChange={(event) => setCostCenterId(event.target.value)}
                required
              />
            </Field>
            <Field label="Centro de custo (código)" htmlFor="si-cc-code" required>
              <Input
                id="si-cc-code"
                value={costCenterCode}
                onChange={(event) => setCostCenterCode(event.target.value)}
                required
              />
            </Field>
          </CreateRecordForm>
        </>
      ) : null}
    </ModulePage>
  );
}

export function ThreeWayMatchPage() {
  const { matchId = '' } = useParams();
  const loader = useCallback((signal?: AbortSignal) => getThreeWayMatch(matchId, signal), [matchId]);
  const { state, reload } = useBackofficeQuery<ThreeWayMatch>({
    loader,
    mapError: mapProcurementErrorToMessage,
    enabled: Boolean(matchId),
  });
  const gate = renderQueryGate(
    'Conferência tripla',
    'Carregando conferência…',
    'Você não tem permissão para ver a conferência tripla.',
    state,
    () => void reload(),
  );
  if (gate) {
    return gate;
  }
  if (state.phase !== 'ready') {
    return (
      <ModulePage>
        <ModulePageHeader title="Conferência tripla" />
        <EmptyState title="Informe um identificador válido" />
      </ModulePage>
    );
  }
  const match = state.data;
  return (
    <ModulePage>
      <ModulePageHeader
        title="Conferência tripla"
        description="Classificação e quantidades são as persistidas pelo servidor."
      />
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <DefinitionList
          items={[
            { label: 'Classificação', value: match.classification },
            { label: 'Motivos', value: match.reasons.join(', ') || '—' },
            { label: 'Qtd pedida', value: match.orderedQuantity },
            { label: 'Qtd recebida', value: match.receivedQuantity },
            {
              label: 'Valor pedido',
              value: <Money value={match.orderedAmount} />,
            },
            {
              label: 'Valor recebido',
              value: <Money value={match.receivedAmount} />,
            },
            {
              label: 'Valor faturado',
              value: <Money value={match.invoicedAmount} />,
            },
            { label: 'Recebimentos', value: String(match.receiptCount) },
            { label: 'Notas', value: String(match.invoiceCount) },
          ]}
        />
      </div>
    </ModulePage>
  );
}
