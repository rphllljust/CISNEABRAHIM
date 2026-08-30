import { Link } from 'react-router-dom';
import { useId, type FormEvent } from 'react';
import { PURCHASE_ORDER_PRICING_STRUCTURES } from '../types/purchase-order.types';
import { formatPurchaseOrderPricingStructure } from '../utils/purchase-order-labels';
import type {
  PurchaseOrderFormFieldErrors,
  PurchaseOrderFormValues,
} from '../utils/purchase-order-form-validation';

type ClientOption = {
  id: string;
  label: string;
};

type PurchaseOrderFormProps = {
  mode: 'create' | 'edit';
  values: PurchaseOrderFormValues;
  clients: ClientOption[];
  clientsLoading: boolean;
  fieldErrors: PurchaseOrderFormFieldErrors;
  submitError: string | null;
  submitting: boolean;
  onChange: (values: PurchaseOrderFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  cancelHref: string;
};

export function PurchaseOrderForm({
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
}: PurchaseOrderFormProps) {
  const formErrorId = useId();

  function updateField<K extends keyof PurchaseOrderFormValues>(
    key: K,
    value: PurchaseOrderFormValues[K],
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

      <section aria-labelledby="po-identification-heading">
        <h2 id="po-identification-heading">Identificação do pedido</h2>
        <div className="requests-form__grid">
          <div className="form-field">
            <label htmlFor="po-client">Cliente</label>
            <select
              id="po-client"
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
            <label htmlFor="po-unit">Unidade operacional</label>
            <input
              id="po-unit"
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
            <label htmlFor="po-number">Número do pedido (PO)</label>
            <input
              id="po-number"
              value={values.poNumber}
              onChange={(event) => updateField('poNumber', event.target.value)}
              required
              disabled={submitting}
              aria-invalid={fieldErrors.poNumber ? true : undefined}
            />
            {fieldErrors.poNumber ? (
              <span className="field-error" role="alert">
                {fieldErrors.poNumber}
              </span>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="po-rc-number">Número RC</label>
            <input
              id="po-rc-number"
              value={values.rcNumber}
              onChange={(event) => updateField('rcNumber', event.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="form-field">
            <label htmlFor="po-issue-date">Data de emissão</label>
            <input
              id="po-issue-date"
              type="date"
              value={values.issueDate}
              onChange={(event) => updateField('issueDate', event.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="form-field">
            <label htmlFor="po-service-manager">Gestor de serviço</label>
            <input
              id="po-service-manager"
              value={values.serviceManager}
              onChange={(event) => updateField('serviceManager', event.target.value)}
              disabled={submitting}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="po-commercial-heading">
        <h2 id="po-commercial-heading">Valores e condições</h2>
        <div className="requests-form__grid">
          <div className="form-field">
            <label htmlFor="po-pricing">Estrutura de preço</label>
            <select
              id="po-pricing"
              value={values.pricingStructure}
              onChange={(event) =>
                updateField(
                  'pricingStructure',
                  event.target.value as PurchaseOrderFormValues['pricingStructure'],
                )
              }
              disabled={submitting}
            >
              {Object.values(PURCHASE_ORDER_PRICING_STRUCTURES).map((structure) => (
                <option key={structure} value={structure}>
                  {formatPurchaseOrderPricingStructure(structure)}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="po-currency">Moeda</label>
            <input
              id="po-currency"
              value={values.currencyCode}
              onChange={(event) => updateField('currencyCode', event.target.value)}
              maxLength={3}
              disabled={submitting}
            />
          </div>
          {values.pricingStructure === PURCHASE_ORDER_PRICING_STRUCTURES.HeaderTotal ? (
            <div className="form-field">
              <label htmlFor="po-total-amount">Valor total autorizado</label>
              <input
                id="po-total-amount"
                inputMode="decimal"
                value={values.totalAmount}
                onChange={(event) => updateField('totalAmount', event.target.value)}
                required
                disabled={submitting}
                aria-invalid={fieldErrors.totalAmount ? true : undefined}
              />
              {fieldErrors.totalAmount ? (
                <span className="field-error" role="alert">
                  {fieldErrors.totalAmount}
                </span>
              ) : null}
            </div>
          ) : null}
          <div className="form-field">
            <label htmlFor="po-payment-terms">Condições de pagamento</label>
            <input
              id="po-payment-terms"
              value={values.paymentTerms}
              onChange={(event) => updateField('paymentTerms', event.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="form-field">
            <label htmlFor="po-payment-method">Forma de pagamento</label>
            <input
              id="po-payment-method"
              value={values.paymentMethod}
              onChange={(event) => updateField('paymentMethod', event.target.value)}
              disabled={submitting}
            />
          </div>
        </div>

        {values.pricingStructure === PURCHASE_ORDER_PRICING_STRUCTURES.LineItems ? (
          <div className="requests-form__grid">
            <div className="form-field">
              <label htmlFor="po-item-description">Descrição do item</label>
              <input
                id="po-item-description"
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
              <label htmlFor="po-item-total">Total da linha</label>
              <input
                id="po-item-total"
                inputMode="decimal"
                value={values.itemLineTotal}
                onChange={(event) => updateField('itemLineTotal', event.target.value)}
                required
                disabled={submitting}
                aria-invalid={fieldErrors.itemLineTotal ? true : undefined}
              />
              {fieldErrors.itemLineTotal ? (
                <span className="field-error" role="alert">
                  {fieldErrors.itemLineTotal}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <div className="button-row">
        <button type="submit" disabled={submitting} aria-busy={submitting}>
          {mode === 'create' ? 'Registrar pedido' : 'Salvar alterações'}
        </button>
        <Link to={cancelHref} className="button-link button-secondary">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
