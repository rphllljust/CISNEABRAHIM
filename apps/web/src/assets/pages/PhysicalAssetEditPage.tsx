import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { mapAssetErrorToMessage } from '../api/asset-error-messages';
import { AssetsApiError, getPhysicalAsset, updatePhysicalAsset } from '../api/physical-assets-api';
import { AssetForm } from '../components/AssetForm';
import { AssetVersionConflictNotice } from '../components/AssetVersionConflictNotice';
import { useAssetCapabilities, useAssetResourceTypes } from '../hooks/useAssetCapabilities';
import type { PhysicalAsset } from '../types/physical-asset.types';
import {
  assetToFormValues,
  buildUpdatePayload,
  validateAssetForm,
  type AssetFormFieldErrors,
  type AssetFormValues,
} from '../utils/asset-form-state';

type EditState =
  | { phase: 'loading' }
  | { phase: 'denied' }
  | { phase: 'not_found' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; asset: PhysicalAsset; values: AssetFormValues };

export function PhysicalAssetEditPage() {
  const { assetId = '' } = useParams();
  const navigate = useNavigate();
  const { capabilities } = useAssetCapabilities();
  const { resourceTypes, loading: resourceTypesLoading } = useAssetResourceTypes();
  const [state, setState] = useState<EditState>({ phase: 'loading' });
  const [fieldErrors, setFieldErrors] = useState<AssetFormFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [versionConflict, setVersionConflict] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reload = useCallback(async () => {
    setState({ phase: 'loading' });
    setSubmitError(null);
    setVersionConflict(false);
    try {
      const asset = await getPhysicalAsset(assetId);
      setState({ phase: 'ready', asset, values: assetToFormValues(asset) });
    } catch (error) {
      if (error instanceof AssetsApiError) {
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
          error instanceof AssetsApiError
            ? mapAssetErrorToMessage(error.code, error.status)
            : 'Não foi possível carregar o ativo.',
      });
    }
  }, [assetId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (state.phase === 'loading') {
    return (
      <main id="main-content" className="shell-page">
        <p aria-busy="true" aria-live="polite">
          Carregando ativo…
        </p>
      </main>
    );
  }

  if (state.phase === 'denied') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Editar ativo</h1>
        <p role="alert">Você não tem permissão para editar este ativo.</p>
        <Link to="/app/assets">Voltar à lista</Link>
      </main>
    );
  }

  if (state.phase === 'not_found') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Editar ativo</h1>
        <p role="alert">Ativo não encontrado.</p>
        <Link to="/app/assets">Voltar à lista</Link>
      </main>
    );
  }

  if (state.phase === 'error') {
    return (
      <main id="main-content" className="shell-page">
        <h1>Editar ativo</h1>
        <p className="form-error" role="alert">
          {state.message}
        </p>
        <button type="button" onClick={() => void reload()}>
          Tentar novamente
        </button>
      </main>
    );
  }

  if (!capabilities.canUpdate) {
    return (
      <main id="main-content" className="shell-page">
        <h1>Editar ativo</h1>
        <p role="alert">Você não tem permissão para editar ativos.</p>
        <Link to={`/app/assets/${assetId}`}>Voltar ao detalhe</Link>
      </main>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || state.phase !== 'ready') {
      return;
    }

    const errors = validateAssetForm(state.values, resourceTypes, 'edit');
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError(null);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    setSubmitting(true);

    try {
      const updated = await updatePhysicalAsset(
        state.asset.id,
        buildUpdatePayload(state.asset.version, state.values, resourceTypes),
      );
      void navigate(`/app/assets/${updated.id}`, { replace: true });
    } catch (error) {
      if (error instanceof AssetsApiError && error.kind === 'version_conflict') {
        setVersionConflict(true);
        setSubmitError(mapAssetErrorToMessage(error.code, error.status));
      } else {
        setSubmitError(
          error instanceof AssetsApiError
            ? mapAssetErrorToMessage(error.code, error.status)
            : 'Não foi possível salvar o ativo.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main-content" className="shell-page assets-page">
      <h1>Editar {state.asset.assetCode}</h1>
      {versionConflict ? <AssetVersionConflictNotice onReload={() => void reload()} /> : null}
      <AssetForm
        mode="edit"
        values={state.values}
        resourceTypes={resourceTypes}
        resourceTypesLoading={resourceTypesLoading}
        fieldErrors={fieldErrors}
        submitError={submitError}
        submitting={submitting}
        onChange={(values) => setState({ ...state, values })}
        onSubmit={(event) => void handleSubmit(event)}
        cancelHref={`/app/assets/${assetId}`}
      />
    </main>
  );
}
