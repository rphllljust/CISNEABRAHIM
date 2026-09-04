import { Field, Input, Select, Textarea } from '../../ui';
import type { ContractFormValues } from '../utils/contract-form-values';

export type ClientOption = {
  id: string;
  label: string;
};

type ContractFormFieldsProps = {
  mode: 'create' | 'edit';
  values: ContractFormValues;
  clients: ClientOption[];
  clientsLoading: boolean;
  disabled: boolean;
  fieldErrors?: Partial<Record<keyof ContractFormValues, string>>;
  onChange: (values: ContractFormValues) => void;
};

function update<F extends keyof ContractFormValues>(
  values: ContractFormValues,
  key: F,
  value: ContractFormValues[F],
  onChange: (values: ContractFormValues) => void,
) {
  onChange({ ...values, [key]: value });
}

export function ContractFormFields({
  mode,
  values,
  clients,
  clientsLoading,
  disabled,
  fieldErrors = {},
  onChange,
}: ContractFormFieldsProps) {
  const clientLocked = mode === 'edit';
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Cliente"
          htmlFor="contract-client"
          required
          error={fieldErrors.clientId}
        >
          <Select
            id="contract-client"
            value={values.clientId}
            disabled={disabled || clientLocked}
            invalid={Boolean(fieldErrors.clientId)}
            onChange={(event) => update(values, 'clientId', event.target.value, onChange)}
          >
            <option value="">{clientsLoading ? 'Carregando…' : 'Selecione…'}</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Unidade operacional" htmlFor="contract-unit" required error={fieldErrors.unitId}>
          <Input
            id="contract-unit"
            value={values.unitId}
            disabled={disabled || clientLocked}
            invalid={Boolean(fieldErrors.unitId)}
            onChange={(event) => update(values, 'unitId', event.target.value, onChange)}
            placeholder="ID da unidade"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Número do contrato"
          htmlFor="contract-number"
          required
          error={fieldErrors.contractNumber}
        >
          <Input
            id="contract-number"
            value={values.contractNumber}
            disabled={disabled}
            invalid={Boolean(fieldErrors.contractNumber)}
            onChange={(event) => update(values, 'contractNumber', event.target.value, onChange)}
          />
        </Field>
        <Field label="Título" htmlFor="contract-title" required error={fieldErrors.title}>
          <Input
            id="contract-title"
            value={values.title}
            disabled={disabled}
            invalid={Boolean(fieldErrors.title)}
            onChange={(event) => update(values, 'title', event.target.value, onChange)}
          />
        </Field>
      </div>

      <Field label="Descrição do escopo" htmlFor="contract-scope">
        <Textarea
          id="contract-scope"
          value={values.scopeDescription}
          disabled={disabled}
          onChange={(event) => update(values, 'scopeDescription', event.target.value, onChange)}
          rows={3}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field
          label="Vigência inicial"
          htmlFor="contract-valid-from"
          required
          error={fieldErrors.validFrom}
        >
          <Input
            id="contract-valid-from"
            type="date"
            value={values.validFrom}
            disabled={disabled}
            invalid={Boolean(fieldErrors.validFrom)}
            onChange={(event) => update(values, 'validFrom', event.target.value, onChange)}
          />
        </Field>
        <Field label="Vigência final" htmlFor="contract-valid-to">
          <Input
            id="contract-valid-to"
            type="date"
            value={values.validTo}
            disabled={disabled}
            onChange={(event) => update(values, 'validTo', event.target.value, onChange)}
          />
        </Field>
        <Field label="Moeda" htmlFor="contract-currency">
          <Input
            id="contract-currency"
            value={values.currencyCode}
            disabled={disabled}
            maxLength={3}
            onChange={(event) => update(values, 'currencyCode', event.target.value, onChange)}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Condições de pagamento" htmlFor="contract-payment-terms">
          <Input
            id="contract-payment-terms"
            value={values.paymentTerms}
            disabled={disabled}
            onChange={(event) => update(values, 'paymentTerms', event.target.value, onChange)}
          />
        </Field>
        <Field label="Forma de pagamento" htmlFor="contract-payment-method">
          <Input
            id="contract-payment-method"
            value={values.paymentMethod}
            disabled={disabled}
            onChange={(event) => update(values, 'paymentMethod', event.target.value, onChange)}
          />
        </Field>
      </div>
    </div>
  );
}
