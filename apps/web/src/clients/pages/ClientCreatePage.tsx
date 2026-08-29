import { Link, useNavigate } from 'react-router-dom';
import { useId, useState, type FormEvent } from 'react';
import { ClientsApiError, createClient } from '../api/clients-api';
import { mapClientErrorToMessage } from '../api/client-error-messages';
import { useClientCapabilities } from '../hooks/useClientCapabilities';
import { maskCnpjInput } from '../utils/format-cnpj';
import { buildCreatePayload, validateCreateClientForm, type ClientFormFieldErrors } from '../utils/client-form-validation';

export function ClientCreatePage() {
  const navigate = useNavigate();
  const { capabilities, loading: capabilitiesLoading } = useClientCapabilities();
  const legalNameId = useId();
  const tradeNameId = useId();
  const taxIdId = useId();
  const externalErpIdId = useId();
  const contactNameId = useId();
  const contactEmailId = useId();
  const contactPhoneId = useId();
  const formErrorId = useId();

  const [legalName, setLegalName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [externalErpId, setExternalErpId] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ClientFormFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (capabilitiesLoading) {
    return (
      <main id="main-content" className="shell-page">
        <p aria-busy="true" aria-live="polite">
          Verificando permissões…
        </p>
      </main>
    );
  }

  if (!capabilities.canCreate) {
    return (
      <main id="main-content" className="shell-page">
        <h1>Novo Cliente</h1>
        <p role="alert">Você não tem permissão para cadastrar Clientes.</p>
        <Link to="/app/clients">Voltar à lista</Link>
      </main>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    const errors = validateCreateClientForm({
      legalName,
      taxId,
      contactName,
      contactEmail,
      contactPhone,
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError(null);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    setSubmitting(true);

    try {
      const created = await createClient(
        buildCreatePayload({
          legalName,
          tradeName,
          taxId,
          externalErpId,
          contactName,
          contactEmail,
          contactPhone,
        }),
      );
      void navigate(`/app/clients/${created.id}`, { replace: true });
    } catch (error) {
      if (error instanceof ClientsApiError) {
        setSubmitError(mapClientErrorToMessage(error.code, error.status));
      } else {
        setSubmitError('Não foi possível cadastrar o Cliente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="shell-page clients-page">
      <h1>Novo Cliente (PJ)</h1>
      <p>Cadastro de pessoa jurídica com CNPJ e contato operacional obrigatório.</p>

      {submitError ? (
        <p id={formErrorId} className="form-error" role="alert">
          {submitError}
        </p>
      ) : null}

      <form
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
        aria-describedby={submitError ? formErrorId : undefined}
      >
        <section aria-labelledby="create-identification-heading">
          <h2 id="create-identification-heading">Identificação jurídica</h2>
          <div className="form-field">
            <label htmlFor={legalNameId}>Razão social</label>
            <input
              id={legalNameId}
              value={legalName}
              onChange={(event) => setLegalName(event.target.value)}
              required
              aria-invalid={fieldErrors.legalName ? true : undefined}
              aria-describedby={fieldErrors.legalName ? `${legalNameId}-error` : undefined}
              disabled={submitting}
            />
            {fieldErrors.legalName ? (
              <span id={`${legalNameId}-error`} className="field-error" role="alert">
                {fieldErrors.legalName}
              </span>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor={tradeNameId}>Nome fantasia (opcional)</label>
            <input
              id={tradeNameId}
              value={tradeName}
              onChange={(event) => setTradeName(event.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="form-field">
            <label htmlFor={taxIdId}>CNPJ</label>
            <input
              id={taxIdId}
              inputMode="numeric"
              autoComplete="off"
              value={taxId}
              onChange={(event) => setTaxId(maskCnpjInput(event.target.value))}
              required
              aria-invalid={fieldErrors.taxId ? true : undefined}
              aria-describedby={fieldErrors.taxId ? `${taxIdId}-error` : undefined}
              disabled={submitting}
            />
            {fieldErrors.taxId ? (
              <span id={`${taxIdId}-error`} className="field-error" role="alert">
                {fieldErrors.taxId}
              </span>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor={externalErpIdId}>Referência ERP externa (opcional)</label>
            <input
              id={externalErpIdId}
              value={externalErpId}
              onChange={(event) => setExternalErpId(event.target.value)}
              disabled={submitting}
            />
          </div>
        </section>

        <section aria-labelledby="create-contact-heading">
          <h2 id="create-contact-heading">Contato operacional</h2>
          <div className="form-field">
            <label htmlFor={contactNameId}>Nome do contato</label>
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
              autoComplete="email"
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
              autoComplete="tel"
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
              disabled={submitting}
            />
          </div>
          {fieldErrors.operationalContact ? (
            <p className="field-error" role="alert">
              {fieldErrors.operationalContact}
            </p>
          ) : (
            <p className="form-hint">Informe pelo menos e-mail ou telefone utilizável.</p>
          )}
        </section>

        <div className="button-row">
          <button type="submit" disabled={submitting} aria-busy={submitting}>
            {submitting ? 'Salvando…' : 'Cadastrar Cliente'}
          </button>
          <Link to="/app/clients" className="button-link button-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}
