import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCallback, useEffect, useId, useState } from 'react';
import {
  CatalogApiError,
  getServiceDefinition,
  getServiceDefinitionVersion,
  updateServiceDefinitionDraft,
} from '../api/service-catalog-api';
import { mapCatalogErrorToMessage } from '../api/catalog-error-messages';
import { ServiceDefinitionForm } from '../components/ServiceDefinitionForm';
import { VersionConflictNotice } from '../components/VersionConflictNotice';
import { VersionStatusBadge } from '../components/VersionStatusBadge';
import { useCatalogCapabilities } from '../hooks/useCatalogCapabilities';
import { useCatalogReferenceData } from '../hooks/useCatalogReferenceData';
import { VERSION_STATUSES } from '../types/service-catalog.types';
import {
  formStateFromVersion,
  toUpdateDraftPayload,
  validateServiceDefinitionForm,
  type ServiceDefinitionFormState,
} from '../utils/catalog-form-state';

type EditState =
  | { phase: 'loading' }
  | { phase: 'denied' }
  | { phase: 'not_editable' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; formState: ServiceDefinitionFormState; lineageVersion: number; version: number };

export function ServiceDefinitionDraftEditPage() {
  const { definitionId = '', versionNumber = '' } = useParams();
  const parsedVersion = Number(versionNumber);
  const navigate = useNavigate();
  const formId = useId();
  const errorId = useId();
  const { capabilities } = useCatalogCapabilities();
  const { data: referenceData, loading: referenceLoading } = useCatalogReferenceData();
  const [state, setState] = useState<EditState>({ phase: 'loading' });
  const [fieldErrors, setFieldErrors] = useState<ReturnType<typeof validateServiceDefinitionForm>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [versionConflict, setVersionConflict] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(async () => {
    setState({ phase: 'loading' });
    setVersionConflict(false);
    try {
      const [definition, version] = await Promise.all([
        getServiceDefinition(definitionId),
        getServiceDefinitionVersion(definitionId, parsedVersion),
      ]);
      if (version.status !== VERSION_STATUSES.Draft) {
        setState({ phase: 'not_editable' });
        return;
      }
      setState({
        phase: 'ready',
        formState: formStateFromVersion(version),
        lineageVersion: definition.version,
        version: version.version,
      });
    } catch (error) {
      if (error instanceof CatalogApiError && error.kind === 'denied') {
        setState({ phase: 'denied' });
        return;
      }
      setState({
        phase: 'error',
        message:
          error instanceof CatalogApiError
            ? mapCatalogErrorToMessage(error.code, error.status)
            : 'Não foi possível carregar o rascunho.',
      });
    }
  }, [definitionId, parsedVersion]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (state.phase === 'loading' || referenceLoading) {
    return (
      <main id="main-content" className="shell-page">
        <p aria-busy="true" aria-live="polite">
          Carregando rascunho…
        </p>
      </main>
    );
  }

  if (!capabilities.canUpdate) {
    return (
      <main id="main-content" className="shell-page">
        <h1>Editar rascunho</h1>
        <p role="alert">Você não tem permissão para editar rascunhos.</p>
        <Link to={`/app/catalog/${definitionId}`}>Voltar</Link>
      </main>
    );
  }

  if (state.phase === 'not_editable') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Editar rascunho</h1>
        <p role="alert">
          Apenas versões em rascunho podem ser editadas. Versões publicadas exigem criação de nova versão.
        </p>
        <Link to={`/app/catalog/${definitionId}/versions/${parsedVersion}`}>Ver versão</Link>
      </main>
    );
  }

  if (state.phase === 'denied' || state.phase === 'error') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Editar rascunho</h1>
        <p role="alert">{state.phase === 'denied' ? 'Acesso negado.' : state.message}</p>
        <Link to={`/app/catalog/${definitionId}`}>Voltar</Link>
      </main>
    );
  }

  async function handleSubmit(): Promise<void> {
    if (state.phase !== 'ready') {
      return;
    }
    const readyState = state;

    const errors = validateServiceDefinitionForm(readyState.formState, { includeCode: false });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError(null);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    setSubmitting(true);
    try {
      await updateServiceDefinitionDraft(
        definitionId,
        readyState.version,
        toUpdateDraftPayload(readyState.formState, readyState.lineageVersion),
      );
      void navigate(`/app/catalog/${definitionId}/versions/${readyState.version}`, { replace: true });
    } catch (error) {
      if (error instanceof CatalogApiError && error.kind === 'version_conflict') {
        setVersionConflict(true);
      }
      setSubmitError(
        error instanceof CatalogApiError
          ? mapCatalogErrorToMessage(error.code, error.status)
          : 'Não foi possível salvar o rascunho.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="shell-page catalog-page">
      <header className="catalog-page__header">
        <div>
          <h1>
            Editar rascunho v{state.version}
          </h1>
          <VersionStatusBadge status={VERSION_STATUSES.Draft} />
        </div>
      </header>

      {versionConflict ? <VersionConflictNotice onReload={() => void reload()} /> : null}
      {submitError ? (
        <p id={errorId} className="form-error" role="alert">
          {submitError}
        </p>
      ) : null}

      <ServiceDefinitionForm
        formId={formId}
        state={state.formState}
        errors={fieldErrors}
        referenceData={referenceData}
        includeCode={false}
        onChange={(formState) => setState({ ...state, formState })}
      />

      <div className="button-row">
        <button type="button" disabled={submitting} onClick={() => void handleSubmit()}>
          {submitting ? 'Salvando…' : 'Salvar rascunho'}
        </button>
        <Link to={`/app/catalog/${definitionId}/versions/${state.version}`} className="button-link button-secondary">
          Cancelar
        </Link>
      </div>
    </main>
  );
}
