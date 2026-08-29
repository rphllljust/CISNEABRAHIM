import { Link } from 'react-router-dom';
import { useId, type FormEvent } from 'react';
import type { PhysicalResourceTypeOption } from '../types/physical-asset.types';
import {
  isVehicleResourceType,
  type AssetFormFieldErrors,
  type AssetFormValues,
} from '../utils/asset-form-state';

type AssetFormProps = {
  mode: 'create' | 'edit';
  values: AssetFormValues;
  resourceTypes: PhysicalResourceTypeOption[];
  resourceTypesLoading: boolean;
  fieldErrors: AssetFormFieldErrors;
  submitError: string | null;
  submitting: boolean;
  onChange: (values: AssetFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  cancelHref: string;
};

export function AssetForm({
  mode,
  values,
  resourceTypes,
  resourceTypesLoading,
  fieldErrors,
  submitError,
  submitting,
  onChange,
  onSubmit,
  cancelHref,
}: AssetFormProps) {
  const formErrorId = useId();
  const showVehicleFields = isVehicleResourceType(values.resourceTypeId, resourceTypes);
  const selectedType = resourceTypes.find((type) => type.id === values.resourceTypeId);

  function updateField<K extends keyof AssetFormValues>(key: K, value: AssetFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="assets-form"
      aria-describedby={submitError ? formErrorId : undefined}
    >
      {submitError ? (
        <p id={formErrorId} className="form-error" role="alert">
          {submitError}
        </p>
      ) : null}

      <section aria-labelledby="asset-core-heading">
        <h2 id="asset-core-heading">Identificação</h2>
        <div className="assets-form__grid">
          {mode === 'create' ? (
            <div className="form-field">
              <label htmlFor="asset-code">Código do ativo</label>
              <input
                id="asset-code"
                value={values.assetCode}
                onChange={(event) => updateField('assetCode', event.target.value)}
                required
                aria-invalid={fieldErrors.assetCode ? true : undefined}
                disabled={submitting}
              />
              {fieldErrors.assetCode ? (
                <span className="field-error" role="alert">
                  {fieldErrors.assetCode}
                </span>
              ) : null}
            </div>
          ) : (
            <div className="form-field">
              <span className="form-label">Código do ativo</span>
              <p>{values.assetCode}</p>
            </div>
          )}

          <div className="form-field">
            <label htmlFor="asset-name">Nome / descrição</label>
            <input
              id="asset-name"
              value={values.name}
              onChange={(event) => updateField('name', event.target.value)}
              required
              aria-invalid={fieldErrors.name ? true : undefined}
              disabled={submitting}
            />
            {fieldErrors.name ? (
              <span className="field-error" role="alert">
                {fieldErrors.name}
              </span>
            ) : null}
          </div>

          {mode === 'create' ? (
            <>
              <div className="form-field">
                <label htmlFor="asset-resource-type">Tipo de recurso</label>
                <select
                  id="asset-resource-type"
                  value={values.resourceTypeId}
                  onChange={(event) => updateField('resourceTypeId', event.target.value)}
                  required
                  disabled={submitting || resourceTypesLoading}
                  aria-invalid={fieldErrors.resourceTypeId ? true : undefined}
                >
                  <option value="">Selecione…</option>
                  {resourceTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.code})
                    </option>
                  ))}
                </select>
                {fieldErrors.resourceTypeId ? (
                  <span className="field-error" role="alert">
                    {fieldErrors.resourceTypeId}
                  </span>
                ) : null}
              </div>
              <div className="form-field">
                <label htmlFor="asset-unit-id">Unidade operacional</label>
                <input
                  id="asset-unit-id"
                  value={values.unitId}
                  onChange={(event) => updateField('unitId', event.target.value)}
                  required
                  aria-invalid={fieldErrors.unitId ? true : undefined}
                  disabled={submitting}
                />
                {fieldErrors.unitId ? (
                  <span className="field-error" role="alert">
                    {fieldErrors.unitId}
                  </span>
                ) : (
                  <p className="form-hint">Identificador da unidade registrada no escopo operacional.</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="form-field">
                <span className="form-label">Tipo de recurso</span>
                <p>
                  {selectedType ? `${selectedType.name} (${selectedType.code})` : values.resourceTypeId}
                </p>
              </div>
              <div className="form-field">
                <span className="form-label">Unidade operacional</span>
                <p>{values.unitId}</p>
              </div>
            </>
          )}
        </div>
      </section>

      {showVehicleFields ? (
        <section aria-labelledby="asset-vehicle-heading">
          <h2 id="asset-vehicle-heading">Dados do veículo</h2>
          <p className="form-hint">
            Campos específicos de veículo — não se aplicam a máquinas ou outros tipos.
          </p>
          <div className="assets-form__grid">
            <div className="form-field">
              <label htmlFor="asset-plate">Placa</label>
              <input
                id="asset-plate"
                value={values.plate}
                onChange={(event) => updateField('plate', event.target.value)}
                required
                aria-invalid={fieldErrors.plate ? true : undefined}
                disabled={submitting}
              />
              {fieldErrors.plate ? (
                <span className="field-error" role="alert">
                  {fieldErrors.plate}
                </span>
              ) : null}
            </div>
            <div className="form-field">
              <label htmlFor="asset-chassis">Chassi (opcional)</label>
              <input
                id="asset-chassis"
                value={values.chassis}
                onChange={(event) => updateField('chassis', event.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="form-field">
              <label htmlFor="asset-model">Modelo (opcional)</label>
              <input
                id="asset-model"
                value={values.model}
                onChange={(event) => updateField('model', event.target.value)}
                disabled={submitting}
              />
            </div>
          </div>
        </section>
      ) : null}

      <div className="button-row">
        <button type="submit" disabled={submitting} aria-busy={submitting}>
          {submitting ? 'Salvando…' : mode === 'create' ? 'Cadastrar ativo' : 'Salvar alterações'}
        </button>
        <Link to={cancelHref} className="button-link button-secondary">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
