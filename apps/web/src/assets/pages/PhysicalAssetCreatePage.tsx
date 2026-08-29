import { Link, useNavigate } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { mapAssetErrorToMessage } from '../api/asset-error-messages';
import { AssetsApiError, createPhysicalAsset } from '../api/physical-assets-api';
import { AssetForm } from '../components/AssetForm';
import { useAssetCapabilities, useAssetResourceTypes } from '../hooks/useAssetCapabilities';
import {
  buildCreatePayload,
  validateAssetForm,
  type AssetFormFieldErrors,
  type AssetFormValues,
} from '../utils/asset-form-state';

const EMPTY_VALUES: AssetFormValues = {
  assetCode: '',
  resourceTypeId: '',
  name: '',
  unitId: '',
  plate: '',
  chassis: '',
  model: '',
};

export function PhysicalAssetCreatePage() {
  const navigate = useNavigate();
  const { capabilities, loading: capabilitiesLoading } = useAssetCapabilities();
  const { resourceTypes, loading: resourceTypesLoading } = useAssetResourceTypes();
  const [values, setValues] = useState<AssetFormValues>(EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<AssetFormFieldErrors>({});
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
        <h1>Novo ativo físico</h1>
        <p role="alert">Você não tem permissão para cadastrar ativos.</p>
        <Link to="/app/assets">Voltar à lista</Link>
      </main>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    const errors = validateAssetForm(values, resourceTypes, 'create');
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError(null);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    setSubmitting(true);

    try {
      const created = await createPhysicalAsset(buildCreatePayload(values, resourceTypes));
      void navigate(`/app/assets/${created.id}`, { replace: true });
    } catch (error) {
      if (error instanceof AssetsApiError) {
        setSubmitError(mapAssetErrorToMessage(error.code, error.status));
      } else {
        setSubmitError('Não foi possível cadastrar o ativo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="shell-page assets-page">
      <h1>Novo ativo físico</h1>
      <p>Cadastre uma instância física vinculada a um tipo de recurso do catálogo.</p>
      <AssetForm
        mode="create"
        values={values}
        resourceTypes={resourceTypes}
        resourceTypesLoading={resourceTypesLoading}
        fieldErrors={fieldErrors}
        submitError={submitError}
        submitting={submitting}
        onChange={setValues}
        onSubmit={(event) => void handleSubmit(event)}
        cancelHref="/app/assets"
      />
    </main>
  );
}
