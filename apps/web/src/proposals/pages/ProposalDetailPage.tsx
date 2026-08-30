import { Link, useParams } from 'react-router-dom';
import { useCallback, useEffect, useId, useState } from 'react';
import { ConfirmDialog } from '../../clients/components/ConfirmDialog';
import {
  acceptProposalVersion,
  cancelProposalVersion,
  createProposalRevision,
  expireProposalVersion,
  getProposal,
  issueProposalVersion,
  listProposalVersions,
  ProposalsApiError,
  rejectProposalVersion,
} from '../api/proposals-api';
import { mapProposalErrorToMessage } from '../api/proposal-error-messages';
import { ProposalStatusBadge } from '../components/ProposalStatusBadge';
import { VersionConflictNotice } from '../components/VersionConflictNotice';
import { useProposalCapabilities } from '../hooks/useProposalCapabilities';
import {
  PROPOSAL_ACCEPTANCE_ORIGINS,
  PROPOSAL_VERSION_STATUSES,
  type ProposalDetail,
  type ProposalVersion,
} from '../types/proposal.types';
import {
  formatAcceptanceOrigin,
  formatClientSnapshot,
  formatDateTime,
  formatMoney,
  formatProposalPricingStructure,
} from '../utils/proposal-labels';

type DetailState =
  | { phase: 'loading' }
  | { phase: 'denied' }
  | { phase: 'not_found' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; detail: ProposalDetail; versions: ProposalVersion[] };

export function ProposalDetailPage() {
  const { proposalId = '' } = useParams();
  const reasonId = useId();
  const { capabilities } = useProposalCapabilities();
  const [state, setState] = useState<DetailState>({ phase: 'loading' });
  const [actionError, setActionError] = useState<string | null>(null);
  const [versionConflict, setVersionConflict] = useState(false);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [acceptOrigin, setAcceptOrigin] = useState<string>(
    PROPOSAL_ACCEPTANCE_ORIGINS.InternalApproval,
  );

  const reload = useCallback(async () => {
    setState({ phase: 'loading' });
    setActionError(null);
    setVersionConflict(false);
    try {
      const [detail, versions] = await Promise.all([
        getProposal(proposalId),
        listProposalVersions(proposalId),
      ]);
      setState({ phase: 'ready', detail, versions });
    } catch (error) {
      if (error instanceof ProposalsApiError) {
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
          error instanceof ProposalsApiError
            ? mapProposalErrorToMessage(error.code, error.status)
            : 'Não foi possível carregar a proposta.',
      });
    }
  }, [proposalId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function runAction(action: () => Promise<void>): Promise<void> {
    if (state.phase !== 'ready') {
      return;
    }
    setActionSubmitting(true);
    setActionError(null);
    try {
      await action();
      await reload();
    } catch (error) {
      if (error instanceof ProposalsApiError && error.kind === 'version_conflict') {
        setVersionConflict(true);
      }
      setActionError(
        error instanceof ProposalsApiError
          ? mapProposalErrorToMessage(error.code, error.status)
          : 'Não foi possível concluir a operação.',
      );
    } finally {
      setActionSubmitting(false);
    }
  }

  if (state.phase === 'loading') {
    return (
      <main id="main-content" className="shell-page">
        <p aria-busy="true" aria-live="polite">
          Carregando proposta…
        </p>
      </main>
    );
  }

  if (state.phase === 'denied') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Proposta comercial</h1>
        <p role="alert">Você não tem permissão para consultar esta proposta.</p>
        <Link to="/app/proposals">Voltar à lista</Link>
      </main>
    );
  }

  if (state.phase === 'not_found') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Proposta comercial</h1>
        <p role="alert">Proposta não encontrada.</p>
        <Link to="/app/proposals">Voltar à lista</Link>
      </main>
    );
  }

  if (state.phase === 'error') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Proposta comercial</h1>
        <p className="form-error" role="alert">
          {state.message}
        </p>
        <button type="button" onClick={() => void reload()}>
          Tentar novamente
        </button>
      </main>
    );
  }

  const { detail, versions } = state;
  const { proposal } = detail;
  const version = detail.currentVersion;
  const status = version?.status;

  const canEdit =
    capabilities.canUpdate && status === PROPOSAL_VERSION_STATUSES.Draft && version;
  const canIssue =
    capabilities.canIssue && status === PROPOSAL_VERSION_STATUSES.Draft && version;
  const canAccept =
    capabilities.canAccept && status === PROPOSAL_VERSION_STATUSES.Issued && version;
  const canReject =
    capabilities.canReject && status === PROPOSAL_VERSION_STATUSES.Issued && version;
  const canExpire =
    capabilities.canExpire && status === PROPOSAL_VERSION_STATUSES.Issued && version;
  const canCancel =
    capabilities.canCancel &&
    version &&
    (status === PROPOSAL_VERSION_STATUSES.Draft || status === PROPOSAL_VERSION_STATUSES.Issued);
  const canCreateRevision =
    capabilities.canUpdate &&
    version &&
    (status === PROPOSAL_VERSION_STATUSES.Issued ||
      status === PROPOSAL_VERSION_STATUSES.Rejected ||
      status === PROPOSAL_VERSION_STATUSES.Expired ||
      status === PROPOSAL_VERSION_STATUSES.Cancelled);

  const displayAmount =
    version?.globalSalePrice ??
    (version && version.items.length > 0
      ? version.items
          .reduce((sum, item) => {
            const amount = Number.parseFloat(item.lineSaleAmount ?? '0');
            return sum + (Number.isNaN(amount) ? 0 : amount);
          }, 0)
          .toFixed(4)
      : null);

  return (
    <main id="main-content" className="shell-page requests-page">
      <header className="requests-page__header">
        <div>
          <h1>{proposal.proposalCode}</h1>
          <p className="form-hint">{proposal.title}</p>
          {version ? <ProposalStatusBadge status={version.status} /> : null}
        </div>
        <div className="button-row">
          {canEdit ? (
            <Link
              to={`/app/proposals/${proposal.id}/edit`}
              className="button-link button-secondary"
            >
              Editar rascunho
            </Link>
          ) : null}
          {canIssue ? (
            <button
              type="button"
              disabled={actionSubmitting}
              onClick={() =>
                void runAction(async () => {
                  if (!version) {
                    return;
                  }
                  await issueProposalVersion(
                    proposal.id,
                    version.versionNumber,
                    version.rowVersion,
                  );
                })
              }
            >
              Emitir
            </button>
          ) : null}
          {canAccept ? (
            <button
              type="button"
              disabled={actionSubmitting}
              onClick={() => setAcceptOpen(true)}
            >
              Aceitar
            </button>
          ) : null}
          {canReject ? (
            <button
              type="button"
              className="button-secondary"
              disabled={actionSubmitting}
              onClick={() => setRejectOpen(true)}
            >
              Rejeitar
            </button>
          ) : null}
          {canExpire ? (
            <button
              type="button"
              className="button-secondary"
              disabled={actionSubmitting}
              onClick={() =>
                void runAction(async () => {
                  if (!version) {
                    return;
                  }
                  await expireProposalVersion(
                    proposal.id,
                    version.versionNumber,
                    version.rowVersion,
                  );
                })
              }
            >
              Expirar
            </button>
          ) : null}
          {canCancel ? (
            <button
              type="button"
              className="button-secondary"
              disabled={actionSubmitting}
              onClick={() => setCancelOpen(true)}
            >
              Cancelar
            </button>
          ) : null}
          {canCreateRevision ? (
            <button
              type="button"
              className="button-secondary"
              disabled={actionSubmitting}
              onClick={() =>
                void runAction(async () => {
                  await createProposalRevision(proposal.id);
                })
              }
            >
              Nova versão
            </button>
          ) : null}
        </div>
      </header>

      {versionConflict ? <VersionConflictNotice onReload={() => void reload()} /> : null}
      {actionError ? (
        <p className="form-error" role="alert">
          {actionError}
        </p>
      ) : null}

      <section className="requests-section" aria-labelledby="proposal-summary-heading">
        <h2 id="proposal-summary-heading">Resumo</h2>
        <dl className="requests-details">
          <div>
            <dt>Cliente</dt>
            <dd>
              <Link to={`/app/clients/${proposal.clientId}`}>Ver cliente</Link>
              {version?.clientSnapshot ? (
                <span className="form-hint">
                  {' '}
                  ({formatClientSnapshot(version.clientSnapshot)})
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt>Unidade</dt>
            <dd>{proposal.unitId}</dd>
          </div>
          <div>
            <dt>Versão atual</dt>
            <dd>{proposal.currentVersionNumber ?? '—'}</dd>
          </div>
          <div>
            <dt>Estrutura de preço</dt>
            <dd>{version ? formatProposalPricingStructure(version.pricingStructure) : '—'}</dd>
          </div>
          <div>
            <dt>Valor</dt>
            <dd className="numeric">{formatMoney(displayAmount, version?.currencyCode)}</dd>
          </div>
          <div>
            <dt>Validade</dt>
            <dd>{formatDateTime(version?.validUntil)}</dd>
          </div>
          <div>
            <dt>Emitida em</dt>
            <dd>{formatDateTime(version?.issuedAt)}</dd>
          </div>
          <div>
            <dt>Atualizada em</dt>
            <dd>{formatDateTime(proposal.updatedAt)}</dd>
          </div>
        </dl>
      </section>

      {version?.notes ? (
        <section className="requests-section" aria-labelledby="proposal-notes-heading">
          <h2 id="proposal-notes-heading">Observações</h2>
          <p>{version.notes}</p>
        </section>
      ) : null}

      {version && version.items.length > 0 ? (
        <section className="requests-section" aria-labelledby="proposal-items-heading">
          <h2 id="proposal-items-heading">Itens</h2>
          <table className="requests-table" aria-label="Itens da proposta">
            <thead>
              <tr>
                <th scope="col">Linha</th>
                <th scope="col">Descrição</th>
                <th scope="col">Qtd.</th>
                <th scope="col">Valor</th>
              </tr>
            </thead>
            <tbody>
              {version.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.lineNumber}</td>
                  <td>{item.description}</td>
                  <td>{item.quantity ?? '—'}</td>
                  <td className="numeric">
                    {formatMoney(item.lineSaleAmount, version.currencyCode)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {versions.length > 0 ? (
        <section className="requests-section" aria-labelledby="proposal-history-heading">
          <h2 id="proposal-history-heading">Histórico de versões</h2>
          <table className="requests-table" aria-label="Histórico de versões">
            <thead>
              <tr>
                <th scope="col">Versão</th>
                <th scope="col">Status</th>
                <th scope="col">Emitida em</th>
                <th scope="col">Aceita em</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((entry) => (
                <tr key={entry.id}>
                  <td>v{entry.versionNumber}</td>
                  <td>
                    <ProposalStatusBadge status={entry.status} />
                  </td>
                  <td>{formatDateTime(entry.issuedAt)}</td>
                  <td>{formatDateTime(entry.acceptedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {version?.rejectionReason ? (
        <section className="requests-section">
          <h2>Rejeição</h2>
          <p>{version.rejectionReason}</p>
        </section>
      ) : null}

      {version?.cancellationReason ? (
        <section className="requests-section">
          <h2>Cancelamento</h2>
          <p>{version.cancellationReason}</p>
        </section>
      ) : null}

      <p>
        <Link to="/app/proposals">Voltar à lista</Link>
      </p>

      <ConfirmDialog
        open={acceptOpen}
        title="Aceitar proposta"
        description="Confirme a origem da aceitação comercial."
        confirmLabel="Confirmar aceitação"
        confirmDisabled={actionSubmitting}
        onCancel={() => setAcceptOpen(false)}
        onConfirm={() => {
          void runAction(async () => {
            if (!version) {
              return;
            }
            await acceptProposalVersion(proposal.id, version.versionNumber, {
              rowVersion: version.rowVersion,
              acceptanceOriginCode:
                acceptOrigin as (typeof PROPOSAL_ACCEPTANCE_ORIGINS)[keyof typeof PROPOSAL_ACCEPTANCE_ORIGINS],
            });
            setAcceptOpen(false);
          });
        }}
      >
        <div className="form-field">
          <label htmlFor={`${reasonId}-accept-origin`}>Origem da aceitação</label>
          <select
            id={`${reasonId}-accept-origin`}
            value={acceptOrigin}
            onChange={(event) => setAcceptOrigin(event.target.value)}
          >
            {Object.values(PROPOSAL_ACCEPTANCE_ORIGINS).map((origin) => (
              <option key={origin} value={origin}>
                {formatAcceptanceOrigin(origin)}
              </option>
            ))}
          </select>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={rejectOpen}
        title="Rejeitar proposta"
        description="Informe o motivo da rejeição, se aplicável."
        confirmLabel="Confirmar rejeição"
        confirmDisabled={actionSubmitting}
        onCancel={() => {
          setRejectOpen(false);
          setRejectReason('');
        }}
        onConfirm={() => {
          void runAction(async () => {
            if (!version) {
              return;
            }
            await rejectProposalVersion(proposal.id, version.versionNumber, {
              rowVersion: version.rowVersion,
              rejectionReason: rejectReason.trim() || undefined,
            });
            setRejectOpen(false);
            setRejectReason('');
          });
        }}
      >
        <div className="form-field">
          <label htmlFor={`${reasonId}-reject`}>Motivo</label>
          <textarea
            id={`${reasonId}-reject`}
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            rows={3}
          />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancelar proposta"
        description="Informe o motivo do cancelamento."
        confirmLabel="Confirmar cancelamento"
        confirmDisabled={actionSubmitting}
        onCancel={() => {
          setCancelOpen(false);
          setCancelReason('');
        }}
        onConfirm={() => {
          void runAction(async () => {
            if (!version) {
              return;
            }
            await cancelProposalVersion(proposal.id, version.versionNumber, {
              rowVersion: version.rowVersion,
              cancellationReason: cancelReason.trim() || undefined,
            });
            setCancelOpen(false);
            setCancelReason('');
          });
        }}
      >
        <div className="form-field">
          <label htmlFor={`${reasonId}-cancel`}>Motivo</label>
          <textarea
            id={`${reasonId}-cancel`}
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            rows={3}
          />
        </div>
      </ConfirmDialog>
    </main>
  );
}
