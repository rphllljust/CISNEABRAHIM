import { Link, useNavigate } from 'react-router-dom';
import { useId, useState } from 'react';
import { CatalogApiError, createServiceDefinition } from '../api/service-catalog-api';
import { mapCatalogErrorToMessage } from '../api/catalog-error-messages';
import { ServiceDefinitionForm } from '../components/ServiceDefinitionForm';
import { useCatalogCapabilities } from '../hooks/useCatalogCapabilities';
import { useCatalogReferenceData } from '../hooks/useCatalogReferenceData';
import {
  createEmptyFormState,
  toCreatePayload,
  validateServiceDefinitionForm,
  type ServiceDefinitionFormState,
} from '../utils/catalog-form-state';

export function ServiceDefinitionCreatePage() {
  const navigate = useNavigate();
  const formId = useId();
  const errorId = useId();
  const { capabilities, loading: capabilitiesLoading } = useCatalogCapabilities();
  const { data: referenceData, loading: referenceLoading } = useCatalogReferenceData();
  const [formState, setFormState] = useState<ServiceDefinitionFormState>(createEmptyFormState);
  const [fieldErrors, setFieldErrors] = useState<ReturnType<typeof validateServiceDefinitionForm>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (capabilitiesLoading || referenceLoading) {
    return (
      <main id="main-content" className="shell-page">
        <p aria-busy="true" aria-live="polite">
          Carregando formulário…
        </p>
      </main>
    );
  }

  if (!capabilities.canCreate) {
    return (
      <main id="main-content" className="shell-page">
        <h1>Nova definição de serviço</h1>
        <p role="alert">Você não tem permissão para criar definições.</p>
        <Link to="/app/catalog">Voltar à lista</Link>
      </main>
    );
  }

  async function handleSubmit(): Promise<void> {
    const errors = validateServiceDefinitionForm(formState, { includeCode: true });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError(null);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    setSubmitting(true);
    try {
      const created = await createServiceDefinition(toCreatePayload(formState));
      void navigate(`/app/catalog/${created.serviceDefinitionId}/versions/${created.version}`, {
        replace: true,
      });
    } catch (error) {
      setSubmitError(
        error instanceof CatalogApiError
          ? mapCatalogErrorToMessage(error.code, error.status)
          : 'Não foi possível criar a definição.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="shell-page catalog-page">
      <h1>Nova definição de serviço</h1>
      <p className="form-hint">
        A publicação e validação de regras são executadas exclusivamente pelo backend.
      </p>

      {submitError ? (
        <p id={errorId} className="form-error" role="alert">
          {submitError}
        </p>
      ) : null}

      <ServiceDefinitionForm
        formId={formId}
        state={formState}
        errors={fieldErrors}
        referenceData={referenceData}
        includeCode
        onChange={setFormState}
      />

      <div className="button-row">
        <button type="button" disabled={submitting} onClick={() => void handleSubmit()}>
          {submitting ? 'Salvando…' : 'Criar rascunho'}
        </button>
        <Link to="/app/catalog" className="button-link button-secondary">
          Cancelar
        </Link>
      </div>
    </main>
  );
}
