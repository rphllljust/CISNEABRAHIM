import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button, EmptyState, Field, Input, Money, Select } from '../../ui';
import { ModulePage, ModulePageHeader } from '../../ui/module-layout';
import { DefinitionList } from '../../financial-ui/DefinitionList';
import { CreateRecordForm } from '../../financial-ui/VersionedActionForm';
import { TREASURY_KIND_LABELS, TREASURY_LIFECYCLE_LABELS } from '../../financial-ui/labels';
import { renderQueryGate } from '../../financial-ui/BackofficeStates';
import { useBackofficeQuery } from '../../financial-ui/useBackofficeQuery';
import {
  createTreasuryTransfer,
  getTreasuryAccount,
  getTreasuryReconciliation,
  listTreasuryAccounts,
  postTreasuryMovement,
  reverseTreasuryMovement,
  reverseTreasuryTransfer,
} from '../api/finance-api';
import { mapFinanceErrorToMessage } from '../api/finance-error-messages';
import { FinanceStatusBadge } from '../components/FinanceStatusBadge';
import type { FinancialAccount, TreasuryReconciliation } from '../types/finance.types';
import {
  buildPostMovementPayload,
  buildReverseTreasuryPayload,
  buildTransferPayload,
  hasReversalContent,
} from '../utils/treasury-forms';

type AccountView = {
  account: FinancialAccount;
  reconciliation: TreasuryReconciliation | null;
  /** Erro real do GET de reconciliação — nunca vira '—' silencioso. */
  reconciliationError: string | null;
  reconciliationRetryable: boolean;
};

function describeError(error: unknown): { message: string; retryable: boolean } {
  if (error instanceof Error && 'status' in error) {
    const apiError = error as unknown as { code?: string; status: number; kind: string };
    return {
      message: mapFinanceErrorToMessage(apiError.code, apiError.status),
      retryable: apiError.kind === 'network' || apiError.kind === 'unknown',
    };
  }
  return { message: mapFinanceErrorToMessage(undefined, 0), retryable: true };
}

export function TreasuryAccountDetailPage() {
  const { accountId = '' } = useParams();
  const [movementDraft, setMovementDraft] = useState({
    direction: 'CREDIT',
    amount: '',
    reference: '',
    originId: '',
    originReference: '',
  });
  const [transferDraft, setTransferDraft] = useState({
    toAccountId: '',
    amount: '',
    reference: '',
    originId: '',
    originReference: '',
  });
  const [reverseMovement, setReverseMovement] = useState({
    transactionId: '',
    reference: '',
    reason: '',
  });
  const [reverseTransfer, setReverseTransfer] = useState({
    transferId: '',
    fromAccountId: '',
    toAccountId: '',
    reference: '',
    reason: '',
  });

  const loader = useCallback(
    async (signal?: AbortSignal): Promise<AccountView> => {
      const account = await getTreasuryAccount(accountId, signal);
      try {
        const reconciliation = await getTreasuryReconciliation(accountId, signal);
        return {
          account,
          reconciliation,
          reconciliationError: null,
          reconciliationRetryable: false,
        };
      } catch (error) {
        const failure = describeError(error);
        return {
          account,
          reconciliation: null,
          reconciliationError: failure.message,
          reconciliationRetryable: failure.retryable,
        };
      }
    },
    [accountId],
  );
  const { state, reload } = useBackofficeQuery<AccountView>({
    loader,
    mapError: mapFinanceErrorToMessage,
    enabled: Boolean(accountId),
  });
  const accountsLoader = useCallback((signal?: AbortSignal) => listTreasuryAccounts(signal), []);
  const accountsQuery = useBackofficeQuery<FinancialAccount[]>({
    loader: accountsLoader,
    mapError: mapFinanceErrorToMessage,
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

  const { account, reconciliation, reconciliationError, reconciliationRetryable } = state.data;
  const accounts = accountsQuery.state.phase === 'ready' ? accountsQuery.state.data : [];
  const accountActive = account.lifecycle === 'ACTIVE';
  const transferDestinations = accounts.filter(
    (item) => item.id !== account.id && item.lifecycle === 'ACTIVE',
  );
  const selectedFromAccount = accounts.find((item) => item.id === reverseTransfer.fromAccountId);
  const selectedToAccount = accounts.find((item) => item.id === reverseTransfer.toAccountId);

  function resetMovementDraft() {
    setMovementDraft({ direction: 'CREDIT', amount: '', reference: '', originId: '', originReference: '' });
  }
  function resetTransferDraft() {
    setTransferDraft({ toAccountId: '', amount: '', reference: '', originId: '', originReference: '' });
  }
  function resetReverseMovement() {
    setReverseMovement({ transactionId: '', reference: '', reason: '' });
  }
  function resetReverseTransfer() {
    setReverseTransfer({ transferId: '', fromAccountId: '', toAccountId: '', reference: '', reason: '' });
  }

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
        {reconciliationError ? (
          <div className="mt-4 rounded-md bg-red-50 p-4" role="alert">
            <p className="text-sm text-red-800">
              Não foi possível carregar a conciliação da conta: {reconciliationError}
            </p>
            {reconciliationRetryable ? (
              <Button type="button" variant="secondary" className="mt-3" onClick={() => void reload()}>
                Tentar novamente
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {!accountActive ? (
        <div className="mb-6">
          <EmptyState
            title="Conta encerrada"
            description="Contas encerradas não aceitam lançamentos, transferências ou estornos."
          />
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CreateRecordForm
              title="Registrar movimento"
              description="Movimento manual (origem MANUAL_AUTHORIZED). O backend valida versão, saldo e idempotência."
              submitLabel="Lançar movimento"
              mapError={mapFinanceErrorToMessage}
              onConflictReload={() => void reload()}
              onSuccess={() => {
                resetMovementDraft();
                void reload();
              }}
              onSubmit={async (idempotencyKey) => {
                const { payload } = buildPostMovementPayload({
                  accountId: account.id,
                  accountRowVersion: account.rowVersion,
                  direction: movementDraft.direction,
                  amount: movementDraft.amount,
                  reference: movementDraft.reference,
                  originId: movementDraft.originId,
                  originReference: movementDraft.originReference,
                  idempotencyKey,
                });
                await postTreasuryMovement(account.id, payload);
              }}
            >
              <Field label="Tipo de lançamento" htmlFor="movement-direction" required>
                <Select
                  id="movement-direction"
                  value={movementDraft.direction}
                  onChange={(event) =>
                    setMovementDraft((current) => ({ ...current, direction: event.target.value }))
                  }
                >
                  <option value="CREDIT">Crédito (entrada)</option>
                  <option value="DEBIT">Débito (saída)</option>
                </Select>
              </Field>
              <Field label="Valor" htmlFor="movement-amount" required>
                <Input
                  id="movement-amount"
                  inputMode="decimal"
                  value={movementDraft.amount}
                  onChange={(event) => setMovementDraft((current) => ({ ...current, amount: event.target.value }))}
                  required
                />
              </Field>
              <Field label="Referência" htmlFor="movement-reference" required>
                <Input
                  id="movement-reference"
                  value={movementDraft.reference}
                  onChange={(event) => setMovementDraft((current) => ({ ...current, reference: event.target.value }))}
                  required
                />
              </Field>
              <Field
                label="Documento de origem (UUID)"
                htmlFor="movement-origin-id"
                required
                hint="Identificador da autorização que origina o movimento."
              >
                <Input
                  id="movement-origin-id"
                  value={movementDraft.originId}
                  onChange={(event) => setMovementDraft((current) => ({ ...current, originId: event.target.value }))}
                  required
                />
              </Field>
              <Field label="Referência da origem" htmlFor="movement-origin-reference" required className="md:col-span-2">
                <Input
                  id="movement-origin-reference"
                  value={movementDraft.originReference}
                  onChange={(event) =>
                    setMovementDraft((current) => ({ ...current, originReference: event.target.value }))
                  }
                  required
                />
              </Field>
            </CreateRecordForm>

            <CreateRecordForm
              title="Transferir entre contas"
              description="Transferência com pernas de débito/crédito criadas pelo servidor."
              submitLabel="Transferir"
              mapError={mapFinanceErrorToMessage}
              onConflictReload={() => void reload()}
              onSuccess={() => {
                resetTransferDraft();
                void reload();
              }}
              onSubmit={async (idempotencyKey) => {
                const destination = transferDestinations.find((item) => item.id === transferDraft.toAccountId);
                if (!destination) {
                  throw new Error('Selecione a conta de destino.');
                }
                const { payload } = buildTransferPayload({
                  fromAccountId: account.id,
                  fromAccountRowVersion: account.rowVersion,
                  toAccountId: destination.id,
                  toAccountRowVersion: destination.rowVersion,
                  amount: transferDraft.amount,
                  reference: transferDraft.reference,
                  originId: transferDraft.originId,
                  originReference: transferDraft.originReference,
                  idempotencyKey,
                });
                await createTreasuryTransfer(payload);
              }}
            >
              <Field label="Conta de destino" htmlFor="transfer-destination" required className="md:col-span-2">
                <Select
                  id="transfer-destination"
                  value={transferDraft.toAccountId}
                  onChange={(event) =>
                    setTransferDraft((current) => ({ ...current, toAccountId: event.target.value }))
                  }
                  required
                  disabled={transferDestinations.length === 0}
                >
                  <option value="">
                    {transferDestinations.length === 0
                      ? 'Nenhuma outra conta ativa disponível'
                      : 'Selecione…'}
                  </option>
                  {transferDestinations.map((destination) => (
                    <option key={destination.id} value={destination.id}>
                      {destination.name} · {destination.currencyCode}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Valor" htmlFor="transfer-amount" required>
                <Input
                  id="transfer-amount"
                  inputMode="decimal"
                  value={transferDraft.amount}
                  onChange={(event) => setTransferDraft((current) => ({ ...current, amount: event.target.value }))}
                  required
                />
              </Field>
              <Field label="Referência" htmlFor="transfer-reference" required>
                <Input
                  id="transfer-reference"
                  value={transferDraft.reference}
                  onChange={(event) => setTransferDraft((current) => ({ ...current, reference: event.target.value }))}
                  required
                />
              </Field>
              <Field
                label="Documento de origem (UUID)"
                htmlFor="transfer-origin-id"
                required
                hint="Identificador da autorização da transferência."
              >
                <Input
                  id="transfer-origin-id"
                  value={transferDraft.originId}
                  onChange={(event) => setTransferDraft((current) => ({ ...current, originId: event.target.value }))}
                  required
                />
              </Field>
              <Field label="Referência da origem" htmlFor="transfer-origin-reference" required className="md:col-span-2">
                <Input
                  id="transfer-origin-reference"
                  value={transferDraft.originReference}
                  onChange={(event) =>
                    setTransferDraft((current) => ({ ...current, originReference: event.target.value }))
                  }
                  required
                />
              </Field>
            </CreateRecordForm>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CreateRecordForm
              title="Estornar movimento"
              description="Estorna um movimento manual desta conta (pernas de transferência usam o estorno de transferência)."
              submitLabel="Estornar movimento"
              mapError={mapFinanceErrorToMessage}
              onConflictReload={() => void reload()}
              onSuccess={() => {
                resetReverseMovement();
                void reload();
              }}
              onSubmit={async (idempotencyKey) => {
                if (!hasReversalContent(reverseMovement)) {
                  throw new Error('Preencha identificador, referência e motivo.');
                }
                await reverseTreasuryMovement(
                  reverseMovement.transactionId.trim(),
                  buildReverseTreasuryPayload({
                    rowVersion: account.rowVersion,
                    reference: reverseMovement.reference,
                    reason: reverseMovement.reason,
                    idempotencyKey,
                  }),
                );
              }}
            >
              <Field label="Identificador do movimento" htmlFor="reverse-movement-id" required className="md:col-span-2">
                <Input
                  id="reverse-movement-id"
                  value={reverseMovement.transactionId}
                  onChange={(event) =>
                    setReverseMovement((current) => ({ ...current, transactionId: event.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="Referência do estorno" htmlFor="reverse-movement-reference" required>
                <Input
                  id="reverse-movement-reference"
                  value={reverseMovement.reference}
                  onChange={(event) =>
                    setReverseMovement((current) => ({ ...current, reference: event.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="Motivo" htmlFor="reverse-movement-reason" required>
                <Input
                  id="reverse-movement-reason"
                  value={reverseMovement.reason}
                  onChange={(event) => setReverseMovement((current) => ({ ...current, reason: event.target.value }))}
                  required
                />
              </Field>
            </CreateRecordForm>

            <CreateRecordForm
              title="Estornar transferência"
              description="Estorno de transferência com pernas compensatórias. Selecione as contas originais; o backend valida as versões."
              submitLabel="Estornar transferência"
              mapError={mapFinanceErrorToMessage}
              onConflictReload={() => void reload()}
              onSuccess={() => {
                resetReverseTransfer();
                void reload();
              }}
              onSubmit={async (idempotencyKey) => {
                if (
                  !selectedFromAccount ||
                  !selectedToAccount ||
                  selectedFromAccount.id === selectedToAccount.id ||
                  !hasReversalContent(reverseTransfer)
                ) {
                  throw new Error(
                    'Informe a transferência, duas contas distintas e os campos de estorno.',
                  );
                }
                const payload = buildReverseTreasuryPayload({
                  rowVersion: selectedFromAccount.rowVersion,
                  reference: reverseTransfer.reference,
                  reason: reverseTransfer.reason,
                  idempotencyKey,
                });
                await reverseTreasuryTransfer(reverseTransfer.transferId.trim(), {
                  rowVersion: payload.rowVersion,
                  rowVersionTo: selectedToAccount.rowVersion,
                  idempotencyKey: payload.idempotencyKey,
                  reference: payload.reference,
                  reason: payload.reason,
                });
              }}
            >
              <Field label="Identificador da transferência" htmlFor="reverse-transfer-id" required className="md:col-span-2">
                <Input
                  id="reverse-transfer-id"
                  value={reverseTransfer.transferId}
                  onChange={(event) =>
                    setReverseTransfer((current) => ({ ...current, transferId: event.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="Conta de origem da transferência" htmlFor="reverse-transfer-from" required>
                <Select
                  id="reverse-transfer-from"
                  value={reverseTransfer.fromAccountId}
                  onChange={(event) =>
                    setReverseTransfer((current) => ({ ...current, fromAccountId: event.target.value }))
                  }
                  required
                >
                  <option value="">Selecione…</option>
                  {accounts.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Conta de destino da transferência" htmlFor="reverse-transfer-to" required>
                <Select
                  id="reverse-transfer-to"
                  value={reverseTransfer.toAccountId}
                  onChange={(event) =>
                    setReverseTransfer((current) => ({ ...current, toAccountId: event.target.value }))
                  }
                  required
                >
                  <option value="">Selecione…</option>
                  {accounts.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Referência do estorno" htmlFor="reverse-transfer-reference" required>
                <Input
                  id="reverse-transfer-reference"
                  value={reverseTransfer.reference}
                  onChange={(event) =>
                    setReverseTransfer((current) => ({ ...current, reference: event.target.value }))
                  }
                  required
                />
              </Field>
              <Field label="Motivo" htmlFor="reverse-transfer-reason" required>
                <Input
                  id="reverse-transfer-reason"
                  value={reverseTransfer.reason}
                  onChange={(event) => setReverseTransfer((current) => ({ ...current, reason: event.target.value }))}
                  required
                />
              </Field>
            </CreateRecordForm>
          </div>
        </>
      )}
    </ModulePage>
  );
}
