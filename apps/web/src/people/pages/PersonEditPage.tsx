import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useId, useState, type FormEvent } from 'react';
import { listLaborTypes } from '../../catalog/api/catalog-reference-api';
import { getPerson, PeopleApiError, updatePerson } from '../api/people-api';
import { mapPersonErrorToMessage } from '../api/person-error-messages';
import { usePersonCapabilities } from '../hooks/usePersonCapabilities';
import type { Person } from '../types/person.types';

export function PersonEditPage() {
  const { personId = '' } = useParams();
  const navigate = useNavigate();
  const { capabilities, loading: capabilitiesLoading } = usePersonCapabilities();
  const legalNameId = useId();
  const preferredNameId = useId();
  const laborTypeId = useId();
  const externalErpIdId = useId();

  const [person, setPerson] = useState<Person | null>(null);
  const [legalName, setLegalName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [defaultLaborTypeCode, setDefaultLaborTypeCode] = useState('');
  const [externalErpId, setExternalErpId] = useState('');
  const [laborTypes, setLaborTypes] = useState<Array<{ code: string; name: string }>>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([getPerson(personId, controller.signal), listLaborTypes(controller.signal)])
      .then(([loaded, types]) => {
        setPerson(loaded);
        setLegalName(loaded.legalName);
        setPreferredName(loaded.preferredName ?? '');
        setDefaultLaborTypeCode(loaded.defaultLaborTypeCode ?? '');
        setExternalErpId(loaded.externalErpId ?? '');
        setLaborTypes(types);
      })
      .catch((error: unknown) => {
        if (error instanceof PeopleApiError) {
          setLoadError(mapPersonErrorToMessage(error.code, error.status));
        } else {
          setLoadError('Não foi possível carregar a Pessoa.');
        }
      });
    return () => controller.abort();
  }, [personId]);

  if (capabilitiesLoading || (!person && !loadError)) {
    return (
      <main id="main-content" className="shell-page">
        <p aria-busy="true">Carregando…</p>
      </main>
    );
  }

  if (loadError || !person) {
    return (
      <main id="main-content" className="shell-page">
        <p role="alert">{loadError ?? 'Pessoa não encontrada.'}</p>
        <Link to="/app/people">Voltar à lista</Link>
      </main>
    );
  }

  if (!capabilities.canUpdate) {
    return (
      <main id="main-content" className="shell-page">
        <p role="alert">Você não tem permissão para editar Pessoas.</p>
        <Link to={`/app/people/${person.id}`}>Voltar ao detalhe</Link>
      </main>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!person) {
      return;
    }
    const currentPerson = person;
    if (submitting || legalName.trim().length === 0) {
      setSubmitError('Informe o nome legal.');
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      const updated = await updatePerson(currentPerson.id, {
        version: currentPerson.version,
        legalName: legalName.trim(),
        preferredName: preferredName.trim() || null,
        defaultLaborTypeCode: defaultLaborTypeCode || null,
        externalErpId: externalErpId.trim() || null,
      });
      void navigate(`/app/people/${updated.id}`, { replace: true });
    } catch (error) {
      setSubmitError(
        error instanceof PeopleApiError
          ? mapPersonErrorToMessage(error.code, error.status)
          : 'Não foi possível salvar a Pessoa.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="shell-page">
      <h1>Editar Pessoa</h1>
      <form className="shell-form" onSubmit={(event) => void handleSubmit(event)}>
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
          <label htmlFor={externalErpIdId}>Referência externa (opcional)</label>
          <input
            id={externalErpIdId}
            value={externalErpId}
            onChange={(event) => setExternalErpId(event.target.value)}
          />
        </div>
        {submitError ? (
          <p role="alert" className="shell-form-error">
            {submitError}
          </p>
        ) : null}
        <div className="shell-form-actions">
          <button type="submit" disabled={submitting}>
            {submitting ? 'Salvando…' : 'Salvar'}
          </button>
          <Link to={`/app/people/${person.id}`}>Cancelar</Link>
        </div>
      </form>
    </main>
  );
}
