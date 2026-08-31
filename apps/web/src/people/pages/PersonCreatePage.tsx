import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useId, useState, type FormEvent } from 'react';
import { listLaborTypes } from '../../catalog/api/catalog-reference-api';
import { PeopleApiError, createPerson } from '../api/people-api';
import { mapPersonErrorToMessage } from '../api/person-error-messages';
import { usePersonCapabilities } from '../hooks/usePersonCapabilities';

export function PersonCreatePage() {
  const navigate = useNavigate();
  const { capabilities, loading: capabilitiesLoading } = usePersonCapabilities();
  const legalNameId = useId();
  const preferredNameId = useId();
  const laborTypeId = useId();
  const externalErpIdId = useId();
  const formErrorId = useId();

  const [legalName, setLegalName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [defaultLaborTypeCode, setDefaultLaborTypeCode] = useState('');
  const [externalErpId, setExternalErpId] = useState('');
  const [laborTypes, setLaborTypes] = useState<Array<{ code: string; name: string }>>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void listLaborTypes(controller.signal)
      .then((items) => setLaborTypes(items))
      .catch(() => setLaborTypes([]));
    return () => controller.abort();
  }, []);

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
        <h1>Nova Pessoa</h1>
        <p role="alert">Você não tem permissão para cadastrar Pessoas.</p>
        <Link to="/app/people">Voltar à lista</Link>
      </main>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || legalName.trim().length === 0) {
      setSubmitError('Informe o nome legal.');
      return;
    }

    setSubmitError(null);
    setSubmitting(true);

    try {
      const created = await createPerson({
        legalName: legalName.trim(),
        preferredName: preferredName.trim() || undefined,
        defaultLaborTypeCode: defaultLaborTypeCode || undefined,
        externalErpId: externalErpId.trim() || undefined,
      });
      void navigate(`/app/people/${created.id}`, { replace: true });
    } catch (error) {
      if (error instanceof PeopleApiError) {
        setSubmitError(mapPersonErrorToMessage(error.code, error.status));
      } else {
        setSubmitError('Não foi possível cadastrar a Pessoa.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="shell-page">
      <h1>Nova Pessoa</h1>
      <form className="shell-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <div className="shell-form-field">
          <label htmlFor={legalNameId}>Nome legal *</label>
          <input
            id={legalNameId}
            value={legalName}
            onChange={(event) => setLegalName(event.target.value)}
            required
          />
        </div>
        <div className="shell-form-field">
          <label htmlFor={preferredNameId}>Nome de uso</label>
          <input
            id={preferredNameId}
            value={preferredName}
            onChange={(event) => setPreferredName(event.target.value)}
          />
        </div>
        <div className="shell-form-field">
          <label htmlFor={laborTypeId}>Função operacional padrão</label>
          <select
            id={laborTypeId}
            value={defaultLaborTypeCode}
            onChange={(event) => setDefaultLaborTypeCode(event.target.value)}
          >
            <option value="">Sem função padrão</option>
            {laborTypes.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="shell-form-field">
          <label htmlFor={externalErpIdId}>Referência externa (ERP)</label>
          <input
            id={externalErpIdId}
            value={externalErpId}
            onChange={(event) => setExternalErpId(event.target.value)}
          />
        </div>
        {submitError ? (
          <p id={formErrorId} role="alert" className="shell-form-error">
            {submitError}
          </p>
        ) : null}
        <div className="shell-form-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Salvando…' : 'Cadastrar'}
          </button>
          <Link to="/app/people">Cancelar</Link>
        </div>
      </form>
    </main>
  );
}
