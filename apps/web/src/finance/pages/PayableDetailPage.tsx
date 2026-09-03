import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { DateTime, EmptyState, Money } from '../../ui';
import { ModulePage, ModulePageHeader } from '../../ui/module-layout';
import { DefinitionList } from '../../financial-ui/DefinitionList';
import { MoneyActionForm } from '../../financial-ui/MoneyActionForm';
import { AGING_BUCKET_LABELS, PAYABLE_STATUS_LABELS } from '../../financial-ui/labels';
import { renderQueryGate } from '../../financial-ui/BackofficeStates';
import { useBackofficeQuery } from '../../financial-ui/useBackofficeQuery';
import { cancelPayable, getPayable, payPayable } from '../api/finance-api';
import { mapFinanceErrorToMessage } from '../api/finance-error-messages';
import { FinanceStatusBadge } from '../components/FinanceStatusBadge';
import type { PayableDetail } from '../types/finance.types';

export function PayableDetailPage() {
  const { payableId = '' } = useParams();
  const loader = useCallback((signal?: AbortSignal) => getPayable(payableId, signal), [payableId]);
  const { state, reload, setReady } = useBackofficeQuery<PayableDetail>({
    loader,
    mapError: mapFinanceErrorToMessage,
    enabled: Boolean(payableId),
  });

  const gate = renderQueryGate(
    'Conta a pagar',
    'Carregando título…',
    'Você não tem permissão para ver este título.',
    state,
    () => void reload(),
  );
  if (gate) {
    return gate;
  }
  if (state.phase !== 'ready') {
    return (
      <ModulePage>
        <ModulePageHeader title="Conta a pagar" />
        <EmptyState title="Informe um título válido" />
      </ModulePage>
    );
  }

  const item = state.data;
  const closed = item.lifecycle === 'CANCELLED' || item.status === 'PAID';

  return (
    <ModulePage>
      <ModulePageHeader
        title={item.externalReference ?? item.origin.reference ?? 'Conta a pagar'}
        description="Pagamentos e saldo restante são decididos pelo backend."
      />
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <DefinitionList
          items={[
            {
              label: 'Status',
              value: <FinanceStatusBadge status={item.status} labels={PAYABLE_STATUS_LABELS} />,
            },
            {
              label: 'Aging',
              value: <FinanceStatusBadge status={item.agingBucket} labels={AGING_BUCKET_LABELS} />,
            },
            { label: 'Principal', value: <Money value={item.principal} currencyCode={item.currencyCode} /> },
            {
              label: 'Saldo informado',
              value: <Money value={item.remainingBalance} currencyCode={item.currencyCode} emphasis />,
            },
            { label: 'Pago', value: <Money value={item.paidAmount} currencyCode={item.currencyCode} /> },
            { label: 'Vencimento', value: <DateTime value={item.dueDate} mode="date" /> },
            { label: 'Centro de custo', value: item.costCenter.code },
            { label: 'Versão', value: String(item.rowVersion) },
          ]}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MoneyActionForm
          title="Registrar pagamento"
          description="O valor e a referência são enviados ao servidor sem recálculo local."
          confirmTitle="Confirmar pagamento"
          confirmDescription="O backend valida saldo, versão e origem do pagamento."
          confirmLabel="Pagar"
          amountLabel="Valor"
          extraField={{ id: 'payment-reference', label: 'Referência do pagamento', name: 'paymentReference' }}
          disabled={closed}
          mapError={mapFinanceErrorToMessage}
          onReload={() => void reload()}
          onSubmit={async ({ amount, extra, idempotencyKey }) => {
            const next = await payPayable(item.id, {
              amount: amount ?? '',
              rowVersion: item.rowVersion,
              idempotencyKey,
              paymentReference: extra ?? '',
            });
            setReady(next);
          }}
        />
        <MoneyActionForm
          title="Cancelar título"
          description="Cancelamento exigido pelo servidor com justificativa."
          confirmTitle="Cancelar título"
          confirmDescription="O título só será cancelado se o backend aceitar."
          confirmLabel="Cancelar título"
          reasonLabel="Justificativa"
          disabled={closed}
          mapError={mapFinanceErrorToMessage}
          onReload={() => void reload()}
          onSubmit={async ({ reason, idempotencyKey }) => {
            const next = await cancelPayable(item.id, {
              rowVersion: item.rowVersion,
              cancelReason: reason ?? '',
              idempotencyKey,
            });
            setReady(next);
          }}
        />
      </div>
    </ModulePage>
  );
}
