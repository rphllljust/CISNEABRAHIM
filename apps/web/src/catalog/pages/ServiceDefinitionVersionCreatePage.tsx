import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCallback, useEffect, useId, useState } from 'react';
import {
  CatalogApiError,
  createServiceDefinitionVersion,
  getServiceDefinition,
  getServiceDefinitionVersion,
} from '../api/service-catalog-api';
import { mapCatalogErrorToMessage } from '../api/catalog-error-messages';
import { ServiceDefinitionForm } from '../components/ServiceDefinitionForm';
import { useCatalogCapabilities } from '../hooks/useCatalogCapabilities';
import { useCatalogReferenceData } from '../hooks/useCatalogReferenceData';
import {
  createEmptyFormState,
  formStateFromVersion,
  toVersionMutationPayload,
  validateServiceDefinitionForm,
  type ServiceDefinitionFormState,
} from '../utils/catalog-form-state';

type PageState =
  | { phase: 'loading' }
  | { phase: 'blocked'; reason: string }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; formState: ServiceDefinitionFormState; sourceVersion: number | null };

export function ServiceDefinitionVersionCreatePage() {
  const { definitionId = '' } = useParams();
  const navigate = useNavigate();
  const formId = useId();
  const errorId = useId();
  const { capabilities } = useCatalogCapabilities();
  const { data: referenceData, loading: referenceLoading } = useCatalogReferenceData();
  const [state, setState] = useState<PageState>({ phase: 'loading' });
  const [fieldErrors, setFieldErrors] = useState<ReturnType<typeof validateServiceDefinitionForm>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setState({ phase: 'loading' });
    try {
      const definition = await getServiceDefinition(definitionId);
      if (definition.currentDraftVersion !== null) {
        setState({
          phase: 'blocked',
          reason: `Já existe o rascunho v${definition.currentDraftVersion}. Publique ou edite o rascunho atual antes de criar outra versão.`,
        });
        return;
      }

      const sourceVersion = definition.latestPublishedVersion;
      if (sourceVersion) {
        const version = await getServiceDefinitionVersion(definitionId, sourceVersion);
        setState({
          phase: 'ready',
          formState: formStateFromVersion(version),
          sourceVersion,
        });
        return;
      }

      setState({ phase: 'ready', formState: createEmptyFormState(), sourceVersion: null });
    } catch (error) {
      setState({
        phase: 'error',
        message:
          error instanceof CatalogApiError
            ? mapCatalogErrorToMessage(error.code, error.status)
            : 'Não foi possível preparar a nova versão.',
      });
    }
  }, [definitionId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.phase === 'loading' || referenceLoading) {
    return (
      <main id="main-content" className="shell-page">
        <p aria-busy="true" aria-live="polite">
          Preparando nova versão…
        </p>
      </main>
    );
  }

  if (!capabilities.canUpdate) {
    return (
      <main id="main-content" className="shell-page">
        <h1>Nova versão</h1>
        <p role="alert">Você não tem permissão para criar versões.</p>
        <Link to={`/app/catalog/${definitionId}`}>Voltar</Link>
      </main>
    );
  }

  if (state.phase === 'blocked' || state.phase === 'error') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Nova versão</h1>
        <p role="alert">{state.phase === 'blocked' ? state.reason : state.message}</p>
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
      const payload = {
        ...toVersionMutationPayload(readyState.formState),
        ...(readyState.sourceVersion ? { sourceVersion: readyState.sourceVersion } : {}),
      };
      const created = await createServiceDefinitionVersion(definitionId, payload);
      void navigate(`/app/catalog/${definitionId}/versions/${created.version}`, { replace: true });
    } catch (error) {
      setSubmitError(
        error instanceof CatalogApiError
          ? mapCatalogErrorToMessage(error.code, error.status)
          : 'Não foi possível criar a nova versão.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="shell-page catalog-page">
      <h1>Criar nova versão</h1>
      {state.sourceVersion ? (
        <p className="form-hint" role="note">
          Base inicial copiada da versão publicada v{state.sourceVersion}. Ajuste os campos antes de salvar o rascunho.
        </p>
      ) : null}

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
          {submitting ? 'Criando…' : 'Criar rascunho da nova versão'}
        </button>
        <Link to={`/app/catalog/${definitionId}`} className="button-link button-secondary">
          Cancelar
        </Link>
      </div>
    </main>
  );
}
