import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCallback, useEffect, useId, useState, type FormEvent } from 'react';
import { ClientsApiError, getClient, updateClient } from '../api/clients-api';
import { mapClientErrorToMessage, VERSION_CONFLICT_MESSAGE } from '../api/client-error-messages';
import { useClientCapabilities } from '../hooks/useClientCapabilities';
import { CONTACT_PURPOSES, type Client } from '../types/client.types';
import { formatCnpjDisplay } from '../utils/format-cnpj';

export function ClientEditPage() {
  const { clientId = '' } = useParams();
  const navigate = useNavigate();
  const { capabilities, loading: capabilitiesLoading } = useClientCapabilities();
  const legalNameId = useId();
  const tradeNameId = useId();
  const externalErpIdId = useId();
  const contactNameId = useId();
  const contactEmailId = useId();
  const contactPhoneId = useId();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [legalName, setLegalName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [externalErpId, setExternalErpId] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [versionConflict, setVersionConflict] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadClient = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setVersionConflict(false);
    try {
      const loaded = await getClient(clientId);
      setClient(loaded);
      setLegalName(loaded.legalName);
      setTradeName(loaded.tradeName ?? '');
      setExternalErpId(loaded.externalErpId ?? '');
      const operational =
        loaded.contacts.find((contact) => contact.purpose === CONTACT_PURPOSES.Operational) ??
        loaded.contacts[0];
      setContactName(operational?.name ?? '');
      setContactEmail(operational?.email ?? '');
      setContactPhone(operational?.phone ?? '');
    } catch (error) {
      setLoadError(
        error instanceof ClientsApiError
          ? mapClientErrorToMessage(error.code, error.status)
          : 'Não foi possível carregar o Cliente.',
      );
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void loadClient();
  }, [loadClient]);

  if (capabilitiesLoading) {
    return (
      <main id="main-content" className="shell-page">
        <p aria-busy="true" aria-live="polite">
          Verificando permissões…
        </p>
      </main>
    );
  }

  if (!capabilities.canUpdate) {
    return (
      <main id="main-content" className="shell-page">
        <h1>Editar Cliente</h1>
        <p role="alert">Você não tem permissão para editar Clientes.</p>
        <Link to={`/app/clients/${clientId}`}>Voltar ao detalhe</Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main id="main-content" className="shell-page">
        <p aria-busy="true" aria-live="polite">
          Carregando…
        </p>
      </main>
    );
  }

  if (loadError || !client) {
    return (
      <main id="main-content" className="shell-page">
        <h1>Editar Cliente</h1>
        <p className="form-error" role="alert">
          {loadError ?? 'Cliente não encontrado.'}
        </p>
        <Link to="/app/clients">Voltar à lista</Link>
      </main>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !client) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setVersionConflict(false);

    const contact = {
      name: contactName.trim(),
      purpose: CONTACT_PURPOSES.Operational,
      email: contactEmail.trim() || undefined,
      phone: contactPhone.trim() || undefined,
    };

    try {
      const updated = await updateClient(client.id, {
        version: client.version,
        legalName: legalName.trim(),
        tradeName: tradeName.trim() ? tradeName.trim() : null,
        externalErpId: externalErpId.trim() ? externalErpId.trim() : null,
        contacts: [contact],
      });
      void navigate(`/app/clients/${updated.id}`, { replace: true });
    } catch (error) {
      if (error instanceof ClientsApiError && error.kind === 'version_conflict') {
        setVersionConflict(true);
        setSubmitError(VERSION_CONFLICT_MESSAGE);
      } else {
        setSubmitError(
          error instanceof ClientsApiError
            ? mapClientErrorToMessage(error.code, error.status)
            : 'Não foi possível salvar as alterações.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="shell-page clients-page">
      <h1>Editar Cliente</h1>
      <p>
        CNPJ: <strong>{formatCnpjDisplay(client.taxId)}</strong> (não editável)
      </p>

      {submitError ? (
        <p className="form-error" role="alert">
          {submitError}
        </p>
      ) : null}

      {versionConflict ? (
        <div className="form-notice" role="status">
          <p>{VERSION_CONFLICT_MESSAGE}</p>
          <button type="button" onClick={() => void loadClient()}>
            Recarregar dados atuais
          </button>
        </div>
      ) : null}

      <form onSubmit={(event) => void handleSubmit(event)} noValidate>
        <div className="form-field">
          <label htmlFor={legalNameId}>Razão social</label>
          <input
            id={legalNameId}
            value={legalName}
            onChange={(event) => setLegalName(event.target.value)}
            required
            disabled={submitting}
          />
        </div>
        <div className="form-field">
          <label htmlFor={tradeNameId}>Nome fantasia</label>
          <input
            id={tradeNameId}
            value={tradeName}
            onChange={(event) => setTradeName(event.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="form-field">
          <label htmlFor={externalErpIdId}>Referência ERP externa</label>
          <input
            id={externalErpIdId}
            value={externalErpId}
            onChange={(event) => setExternalErpId(event.target.value)}
            disabled={submitting}
          />
        </div>

        <h2>Contato operacional</h2>
        <div className="form-field">
          <label htmlFor={contactNameId}>Nome</label>
          <input
            id={contactNameId}
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
            required
            disabled={submitting}
          />
        </div>
        <div className="form-field">
          <label htmlFor={contactEmailId}>E-mail</label>
          <input
            id={contactEmailId}
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="form-field">
          <label htmlFor={contactPhoneId}>Telefone</label>
          <input
            id={contactPhoneId}
            type="tel"
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="button-row">
          <button type="submit" disabled={submitting} aria-busy={submitting}>
            {submitting ? 'Salvando…' : 'Salvar alterações'}
          </button>
          <Link to={`/app/clients/${client.id}`} className="button-link button-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}
