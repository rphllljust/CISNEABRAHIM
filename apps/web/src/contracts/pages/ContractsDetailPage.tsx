import { Link, useParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { listClients } from '../../clients/api/clients-api';
import {
  activateContract,
  closeContract,
  ContractsApiError,
  expireContract,
  getContract,
  updateContractDraft,
} from '../api/contracts-api';
import { CONTRACT_VERSION_CONFLICT_MESSAGE, mapContractErrorToMessage } from '../api/contracts-error-messages';
import { ContractStatusBadge } from '../components/ContractStatusBadge';
import { ContractFormFields, type ClientOption } from '../components/ContractFormFields';
import { useContractCapabilities } from '../hooks/useContractCapabilities';
import { CONTRACT_STATUSES, type ContractDetail } from '../types';
import {
  buildUpdateContractDraftPayload,
  contractFormToValues,
  type ContractFormValues,
} from '../utils/contract-form-values';
import {
  formatClientSnapshot,
  formatContractDocumentLinkPurpose,
  formatDate,
  formatDateTime,
  formatMoney,
} from '../utils/contract-status-labels';
import { Button, ConfirmAction, Modal, VersionConflictBanner } from '../../ui';

type DetailState =
  | { phase: 'loading' }
  | { phase: 'denied' }
  | { phase: 'not_found' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; detail: ContractDetail };

type ActionKind = 'update' | 'activate' | 'close' | 'expire';

export function ContractsDetailPage() {
  const { contractId = '' } = useParams();
  const { capabilities } = useContractCapabilities();
  const [state, setState] = useState<DetailState>({ phase: 'loading' });
  const [actionError, setActionError] = useState<string | null>(null);
  const [versionConflict, setVersionConflict] = useState(false);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState<ActionKind | null>(null);
  const [closeReason, setCloseReason] = useState('');
  const [editValues, setEditValues] = useState<ContractFormValues | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    void listClients({ limit: 100, offset: 0 }, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          setClients(
            response.items.map((client) => ({
              id: client.id,
              label: client.tradeName || client.legalName,
            })),
          );
        }
      })
      .catch(() => setClients([]))
      .finally(() => {
        if (!controller.signal.aborted) {
          setClientsLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  const reload = useCallback(async () => {
    setState({ phase: 'loading' });
    setActionError(null);
    setVersionConflict(false);
    try {
      const detail = await getContract(contractId);
      setState({ phase: 'ready', detail });
    } catch (error) {
      if (error instanceof ContractsApiError) {
        if (error.kind === 'denied') {
          setState({ phase: 'denied' });
          return;
        }
        if (error.kind === 'not_found') {
          setState({ phase: 'not_found' });
          return;
        }
      }
      setState({
        phase: 'error',
        message:
          error instanceof ContractsApiError
            ? mapContractErrorToMessage(error.code, error.status)
            : 'Não foi possível carregar o contrato.',
      });
    }
  }, [contractId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  function openEditDialog() {
    if (state.phase !== 'ready') {
      return;
    }
    setEditValues(contractFormToValues(state.detail.contract));
    setActionError(null);
    setOpenDialog('update');
  }

  function closeDialog() {
    setOpenDialog(null);
    setCloseReason('');
  }

  /** Executa uma ação versionada; 409 de versão vira banner com recarga. */
  async function runAction(action: () => Promise<void>) {
    if (state.phase !== 'ready') {
      return;
    }
    setActionSubmitting(true);
    setActionError(null);
    setVersionConflict(false);
    try {
      await action();
      await reload();
      setOpenDialog(null);
      setCloseReason('');
    } catch (error) {
      if (error instanceof ContractsApiError && error.kind === 'version_conflict') {
        setVersionConflict(true);
        setOpenDialog(null);
      } else {
        setActionError(
          error instanceof ContractsApiError
            ? mapContractErrorToMessage(error.code, error.status)
            : 'Não foi possível concluir a operação.',
        );
      }
    } finally {
      setActionSubmitting(false);
    }
  }

  async function handleEditSubmit(): Promise<void> {
    if (state.phase !== 'ready' || !editValues || actionSubmitting) {
      return;
    }
    const { id, rowVersion } = state.detail.contract;
    await runAction(async () => {
      await updateContractDraft(id, buildUpdateContractDraftPayload(rowVersion, editValues));
    });
  }

  if (state.phase === 'loading') {
    return (
      <main id="main-content" className="shell-page">
        <p aria-busy="true" aria-live="polite">
          Carregando contrato…
        </p>
      </main>
    );
  }

  if (state.phase === 'denied') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Contrato</h1>
        <p role="alert">Você não tem permissão para consultar este contrato.</p>
        <Link to="/app/contracts">Voltar à lista</Link>
      </main>
    );
  }

  if (state.phase === 'not_found') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Contrato</h1>
        <p role="alert">Contrato não encontrado.</p>
        <Link to="/app/contracts">Voltar à lista</Link>
      </main>
    );
  }

  if (state.phase === 'error') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Contrato</h1>
        <p className="form-error" role="alert">
          {state.message}
        </p>
        <button type="button" onClick={() => void reload()}>
          Tentar novamente
        </button>
      </main>
    );
  }

  const { contract, items, documentLinks } = state.detail;
  const isDraft = contract.status === CONTRACT_STATUSES.Draft;
  const isActive = contract.status === CONTRACT_STATUSES.Active;

  const canEdit = capabilities.canUpdate && isDraft;
  const canActivate = capabilities.canActivate && isDraft;
  const canClose = capabilities.canClose && isActive;
  const canExpire = capabilities.canExpire && isActive;

  return (
    <main id="main-content" className="shell-page">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{contract.internalCode}</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">{contract.contractNumber}</h1>
          <p className="mt-1 text-sm text-gray-600">{contract.title}</p>
          <div className="mt-2">
            <ContractStatusBadge status={contract.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <Button type="button" variant="secondary" onClick={openEditDialog}>
              Editar dados
            </Button>
          ) : null}
          {canActivate ? (
            <Button type="button" onClick={() => setOpenDialog('activate')}>
              Ativar contrato
            </Button>
          ) : null}
          {canClose ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setCloseReason('');
                setOpenDialog('close');
              }}
            >
              Encerrar contrato
            </Button>
          ) : null}
          {canExpire ? (
            <Button type="button" variant="secondary" onClick={() => setOpenDialog('expire')}>
              Expirar contrato
            </Button>
          ) : null}
        </div>
      </header>

      {versionConflict ? (
        <div className="mb-6">
          <VersionConflictBanner message={CONTRACT_VERSION_CONFLICT_MESSAGE} onReload={() => void reload()} />
        </div>
      ) : null}
      {actionError ? (
        <p className="form-error" role="alert">
          {actionError}
        </p>
      ) : null}

      <section
        className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5"
        aria-labelledby="contract-summary-heading"
      >
        <h2 id="contract-summary-heading" className="mb-4 text-base font-semibold text-gray-900">
          Resumo
        </h2>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <DetailRow label="Cliente" value={formatClientSnapshot(contract.clientSnapshot)} />
          <DetailRow label="Unidade" value={contract.unitId} />
          <DetailRow label="Escopo" value={contract.scopeDescription} />
          <DetailRow label="Moeda" value={contract.currencyCode} />
          <DetailRow
            label="Vigência"
            value={`${formatDate(contract.validFrom)} → ${formatDate(contract.validTo)}`}
          />
          <DetailRow label="Condições de pagamento" value={contract.paymentTerms} />
          <DetailRow label="Forma de pagamento" value={contract.paymentMethod} />
          <DetailRow label="Ativado em" value={formatDateTime(contract.activatedAt)} />
          <DetailRow label="Encerrado em" value={formatDateTime(contract.closedAt)} />
          <DetailRow label="Motivo do encerramento" value={contract.closureReason} />
          <DetailRow label="Criado em" value={formatDateTime(contract.createdAt)} />
          <DetailRow label="Atualizado em" value={formatDateTime(contract.updatedAt)} />
          <DetailRow label="Versão" value={String(contract.rowVersion)} />
        </dl>
      </section>

      {items.length > 0 ? (
        <section
          className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5"
          aria-labelledby="contract-items-heading"
        >
          <h2 id="contract-items-heading" className="mb-4 text-base font-semibold text-gray-900">
            Itens
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" aria-label="Itens do contrato">
              <thead className="text-xs text-gray-500 uppercase">
                <tr>
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    Linha
                  </th>
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    Descrição
                  </th>
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    Qtd.
                  </th>
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    Preço unit.
                  </th>
                  <th scope="col" className="py-2 pr-4 text-right font-semibold">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 pr-4 text-gray-700 tabular-nums">{item.lineNumber}</td>
                    <td className="py-2 pr-4 text-gray-700">{item.description}</td>
                    <td className="py-2 pr-4 text-gray-700 tabular-nums">{item.quantity ?? '—'}</td>
                    <td className="py-2 pr-4 text-gray-700 tabular-nums">
                      {formatMoney(item.unitPrice, contract.currencyCode)}
                    </td>
                    <td className="py-2 pr-4 text-right text-gray-700 tabular-nums">
                      {formatMoney(item.lineTotal, contract.currencyCode)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {documentLinks.length > 0 ? (
        <section
          className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5"
          aria-labelledby="contract-documents-heading"
        >
          <h2 id="contract-documents-heading" className="mb-4 text-base font-semibold text-gray-900">
            Documentos vinculados
          </h2>
          <ul className="space-y-2 text-sm text-gray-700">
            {documentLinks.map((link) => (
              <li key={link.id} className="flex flex-wrap items-center gap-3">
                <Link
                  to={`/app/documents/${link.documentId}`}
                  className="text-brand-700 no-underline hover:text-brand-800"
                >
                  {link.documentId}
                </Link>
                <span className="text-gray-400">·</span>
                <span>{formatContractDocumentLinkPurpose(link.linkPurpose)}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">{formatDateTime(link.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p>
        <Link to="/app/contracts">Voltar à lista</Link>
      </p>

      <Modal
        open={openDialog === 'update'}
        title="Editar dados do contrato"
        description="As alterações são permitidas somente enquanto o contrato estiver em rascunho."
        onClose={() => setOpenDialog(null)}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={actionSubmitting}
              onClick={() => setOpenDialog(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={actionSubmitting}
              loading={actionSubmitting}
              loadingText="Salvando"
              onClick={() => void handleEditSubmit()}
            >
              Salvar alterações
            </Button>
          </>
        }
      >
        {editValues ? (
          <ContractFormFields
            mode="edit"
            values={editValues}
            clients={clients}
            clientsLoading={clientsLoading}
            disabled={actionSubmitting}
            onChange={setEditValues}
          />
        ) : null}
      </Modal>

      <ConfirmAction
        open={openDialog === 'activate'}
        title="Ativar contrato"
        description="A ativação efetiva o contrato com base na vigência informada."
        confirmLabel="Confirmar ativação"
        loading={actionSubmitting}
        onConfirm={() => {
          void runAction(async () => {
            await activateContract(contract.id, { rowVersion: contract.rowVersion });
          });
        }}
        onCancel={closeDialog}
      />

      <ConfirmAction
        open={openDialog === 'close'}
        title="Encerrar contrato"
        description="Informe o motivo do encerramento."
        confirmLabel="Confirmar encerramento"
        confirmDisabled={!closeReason.trim()}
        loading={actionSubmitting}
        onConfirm={() => {
          void runAction(async () => {
            await closeContract(contract.id, {
              rowVersion: contract.rowVersion,
              closureReason: closeReason.trim(),
            });
          });
        }}
        onCancel={closeDialog}
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contract-close-reason" className="text-xs font-semibold text-gray-700">
            Motivo do encerramento
            <span className="text-red-600" aria-hidden="true">
              {' '}
              *
            </span>
            <span className="sr-only"> (obrigatório)</span>
          </label>
          <textarea
            id="contract-close-reason"
            value={closeReason}
            onChange={(event) => setCloseReason(event.target.value)}
            rows={3}
            className="block w-full min-h-[5.5rem] resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-1 ring-gray-300 ring-inset outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </ConfirmAction>

      <ConfirmAction
        open={openDialog === 'expire'}
        title="Expirar contrato"
        description="O backend expira o contrato quando a vigência já terminou; esta ação não exige motivo nem versão."
        confirmLabel="Confirmar expiração"
        loading={actionSubmitting}
        onConfirm={() => {
          void runAction(async () => {
            await expireContract(contract.id);
          });
        }}
        onCancel={closeDialog}
      />
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  );
}
