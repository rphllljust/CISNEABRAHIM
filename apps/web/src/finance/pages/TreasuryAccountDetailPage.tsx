import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { EmptyState, Money } from '../../ui';
import { ModulePage, ModulePageHeader } from '../../ui/module-layout';
import { DefinitionList } from '../../financial-ui/DefinitionList';
import { TREASURY_KIND_LABELS, TREASURY_LIFECYCLE_LABELS } from '../../financial-ui/labels';
import { renderQueryGate } from '../../financial-ui/BackofficeStates';
import { useBackofficeQuery } from '../../financial-ui/useBackofficeQuery';
import { getTreasuryAccount, getTreasuryReconciliation } from '../api/finance-api';
import { mapFinanceErrorToMessage } from '../api/finance-error-messages';
import { FinanceStatusBadge } from '../components/FinanceStatusBadge';
import type { FinancialAccount, TreasuryReconciliation } from '../types/finance.types';

type AccountView = {
  account: FinancialAccount;
  reconciliation: TreasuryReconciliation | null;
};

export function TreasuryAccountDetailPage() {
  const { accountId = '' } = useParams();
  const loader = useCallback(
    async (signal?: AbortSignal): Promise<AccountView> => {
      const account = await getTreasuryAccount(accountId, signal);
      try {
        const reconciliation = await getTreasuryReconciliation(accountId, signal);
        return { account, reconciliation };
      } catch {
        return { account, reconciliation: null };
      }
    },
    [accountId],
  );
  const { state, reload } = useBackofficeQuery<AccountView>({
    loader,
    mapError: mapFinanceErrorToMessage,
    enabled: Boolean(accountId),
  });

  const gate = renderQueryGate(
    'Conta financeira',
    'Carregando conta…',
    'Você não tem permissão para ver esta conta.',
    state,
    () => void reload(),
  );
  if (gate) {
    return gate;
  }
  if (state.phase !== 'ready') {
    return (
      <ModulePage>
        <ModulePageHeader title="Conta financeira" />
        <EmptyState title="Informe uma conta válida" />
      </ModulePage>
    );
  }

  const { account, reconciliation } = state.data;

  return (
    <ModulePage>
      <ModulePageHeader
        title={account.name}
        description="Saldo, créditos e débitos são os totais reconstruídos pelo servidor."
      />
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <DefinitionList
          items={[
            {
              label: 'Tipo',
              value: <FinanceStatusBadge status={account.kind} labels={TREASURY_KIND_LABELS} />,
            },
            {
              label: 'Situação',
              value: <FinanceStatusBadge status={account.lifecycle} labels={TREASURY_LIFECYCLE_LABELS} />,
            },
            { label: 'Código', value: account.code },
            { label: 'Saldo', value: <Money value={account.balance} currencyCode={account.currencyCode} emphasis /> },
            {
              label: 'Créditos',
              value: reconciliation ? <Money value={reconciliation.credits} currencyCode={account.currencyCode} /> : '—',
            },
            {
              label: 'Débitos',
              value: reconciliation ? <Money value={reconciliation.debits} currencyCode={account.currencyCode} /> : '—',
            },
            { label: 'Movimentos', value: reconciliation ? String(reconciliation.movementCount) : '—' },
            {
              label: 'Banco',
              value: account.bank
                ? `${account.bank.bankCode} · ${account.bank.agency} · ${account.bank.accountNumber}`
                : account.cash?.locationCode ?? '—',
            },
          ]}
        />
      </div>
    </ModulePage>
  );
}
