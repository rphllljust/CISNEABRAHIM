import { Link } from 'react-router-dom';
import { useId, type FormEvent } from 'react';
import { PROPOSAL_PRICING_STRUCTURES } from '../types/proposal.types';
import { formatProposalPricingStructure } from '../utils/proposal-labels';
import type {
  ProposalFormFieldErrors,
  ProposalFormValues,
} from '../utils/proposal-form-validation';

type ClientOption = {
  id: string;
  label: string;
};

type ProposalFormProps = {
  mode: 'create' | 'edit';
  values: ProposalFormValues;
  clients: ClientOption[];
  clientsLoading: boolean;
  fieldErrors: ProposalFormFieldErrors;
  submitError: string | null;
  submitting: boolean;
  onChange: (values: ProposalFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  cancelHref: string;
};

export function ProposalForm({
  mode,
  values,
  clients,
  clientsLoading,
  fieldErrors,
  submitError,
  submitting,
  onChange,
  onSubmit,
  cancelHref,
}: ProposalFormProps) {
  const formErrorId = useId();

  function updateField<K extends keyof ProposalFormValues>(
    key: K,
    value: ProposalFormValues[K],
  ) {
    onChange({ ...values, [key]: value });
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="requests-form"
      aria-describedby={submitError ? formErrorId : undefined}
    >
      {submitError ? (
        <p id={formErrorId} className="form-error" role="alert">
          {submitError}
        </p>
      ) : null}

      <section aria-labelledby="proposal-identification-heading">
        <h2 id="proposal-identification-heading">Identificação</h2>
        <div className="requests-form__grid">
          <div className="form-field">
            <label htmlFor="proposal-client">Cliente</label>
            <select
              id="proposal-client"
              value={values.clientId}
              onChange={(event) => updateField('clientId', event.target.value)}
              required
              disabled={submitting || mode === 'edit'}
              aria-invalid={fieldErrors.clientId ? true : undefined}
            >
              <option value="">{clientsLoading ? 'Carregando…' : 'Selecione…'}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.label}
                </option>
              ))}
            </select>
            {fieldErrors.clientId ? (
              <span className="field-error" role="alert">
                {fieldErrors.clientId}
              </span>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="proposal-unit">Unidade operacional</label>
            <input
              id="proposal-unit"
              value={values.unitId}
              onChange={(event) => updateField('unitId', event.target.value)}
              required
              disabled={submitting || mode === 'edit'}
              aria-invalid={fieldErrors.unitId ? true : undefined}
            />
            {fieldErrors.unitId ? (
              <span className="field-error" role="alert">
                {fieldErrors.unitId}
              </span>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="proposal-title">Título</label>
            <input
              id="proposal-title"
              value={values.title}
              onChange={(event) => updateField('title', event.target.value)}
              required
              disabled={submitting}
              aria-invalid={fieldErrors.title ? true : undefined}
            />
            {fieldErrors.title ? (
              <span className="field-error" role="alert">
                {fieldErrors.title}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section aria-labelledby="proposal-commercial-heading">
        <h2 id="proposal-commercial-heading">Condições comerciais</h2>
        <div className="requests-form__grid">
          <div className="form-field">
            <label htmlFor="proposal-pricing">Estrutura de preço</label>
            <select
              id="proposal-pricing"
              value={values.pricingStructure}
              onChange={(event) =>
                updateField(
                  'pricingStructure',
                  event.target.value as ProposalFormValues['pricingStructure'],
                )
              }
              disabled={submitting}
            >
              {Object.values(PROPOSAL_PRICING_STRUCTURES).map((structure) => (
                <option key={structure} value={structure}>
                  {formatProposalPricingStructure(structure)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="proposal-currency">Moeda</label>
            <input
              id="proposal-currency"
              value={values.currencyCode}
              onChange={(event) => updateField('currencyCode', event.target.value)}
              maxLength={3}
              disabled={submitting}
            />
          </div>
          {values.pricingStructure === PROPOSAL_PRICING_STRUCTURES.GlobalPrice ? (
            <div className="form-field">
              <label htmlFor="proposal-global-price">Preço global de venda</label>
              <input
                id="proposal-global-price"
                inputMode="decimal"
                value={values.globalSalePrice}
                onChange={(event) => updateField('globalSalePrice', event.target.value)}
                required
                disabled={submitting}
                aria-invalid={fieldErrors.globalSalePrice ? true : undefined}
              />
              {fieldErrors.globalSalePrice ? (
                <span className="field-error" role="alert">
                  {fieldErrors.globalSalePrice}
                </span>
              ) : null}
            </div>
          ) : null}
          <div className="form-field">
            <label htmlFor="proposal-valid-until">Validade</label>
            <input
              id="proposal-valid-until"
              type="datetime-local"
              value={values.validUntil}
              onChange={(event) => updateField('validUntil', event.target.value)}
              disabled={submitting}
            />
          </div>
        </div>

        {values.pricingStructure === PROPOSAL_PRICING_STRUCTURES.Itemized ? (
          <div className="requests-form__grid">
            <div className="form-field">
              <label htmlFor="proposal-item-description">Descrição do item</label>
              <input
                id="proposal-item-description"
                value={values.itemDescription}
                onChange={(event) => updateField('itemDescription', event.target.value)}
                required
                disabled={submitting}
                aria-invalid={fieldErrors.itemDescription ? true : undefined}
              />
              {fieldErrors.itemDescription ? (
                <span className="field-error" role="alert">
                  {fieldErrors.itemDescription}
                </span>
              ) : null}
            </div>
            <div className="form-field">
              <label htmlFor="proposal-item-amount">Valor de venda do item</label>
              <input
                id="proposal-item-amount"
                inputMode="decimal"
                value={values.itemLineSaleAmount}
                onChange={(event) => updateField('itemLineSaleAmount', event.target.value)}
                required
                disabled={submitting}
                aria-invalid={fieldErrors.itemLineSaleAmount ? true : undefined}
              />
              {fieldErrors.itemLineSaleAmount ? (
                <span className="field-error" role="alert">
                  {fieldErrors.itemLineSaleAmount}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="form-field">
          <label htmlFor="proposal-notes">Observações</label>
          <textarea
            id="proposal-notes"
            value={values.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            rows={3}
            disabled={submitting}
          />
        </div>
      </section>

      <div className="button-row">
        <button type="submit" disabled={submitting} aria-busy={submitting}>
          {mode === 'create' ? 'Registrar proposta' : 'Salvar alterações'}
        </button>
        <Link to={cancelHref} className="button-link button-secondary">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
