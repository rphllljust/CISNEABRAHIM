import type { CreateContractPayload, UpdateContractDraftPayload } from '../types';

/**
 * Estado dos formulários de contrato. Validação de negócio é exclusiva do
 * backend; aqui apenas os campos exigidos pelo parse do DTO (campos
 * obrigatórios) são checados para permitir o envio.
 */
export type ContractFormValues = {
  clientId: string;
  unitId: string;
  contractNumber: string;
  title: string;
  scopeDescription: string;
  validFrom: string;
  validTo: string;
  currencyCode: string;
  paymentTerms: string;
  paymentMethod: string;
};

export const EMPTY_CONTRACT_FORM: ContractFormValues = {
  clientId: '',
  unitId: '',
  contractNumber: '',
  title: '',
  scopeDescription: '',
  validFrom: '',
  validTo: '',
  currencyCode: 'BRL',
  paymentTerms: '',
  paymentMethod: '',
};

function trim(value: string): string {
  return value.trim();
}

/** Campos obrigatórios no parse do create (dto/contracts.dto.ts). */
export function validateContractCreateForm(
  values: ContractFormValues,
): Partial<Record<keyof ContractFormValues, string>> {
  const errors: Partial<Record<keyof ContractFormValues, string>> = {};
  if (!trim(values.clientId)) {
    errors.clientId = 'Selecione um cliente.';
  }
  if (!trim(values.unitId)) {
    errors.unitId = 'Informe a unidade operacional.';
  }
  if (!trim(values.contractNumber)) {
    errors.contractNumber = 'Informe o número do contrato.';
  }
  if (!trim(values.title)) {
    errors.title = 'Informe o título do contrato.';
  }
  if (!trim(values.validFrom)) {
    errors.validFrom = 'Informe a data de início da vigência.';
  }
  return errors;
}

export function buildCreateContractPayload(values: ContractFormValues): CreateContractPayload {
  const scopeDescription = trim(values.scopeDescription);
  const validTo = trim(values.validTo);
  const currencyCode = trim(values.currencyCode);
  const paymentTerms = trim(values.paymentTerms);
  const paymentMethod = trim(values.paymentMethod);
  return {
    clientId: trim(values.clientId),
    unitId: trim(values.unitId),
    contractNumber: trim(values.contractNumber),
    title: trim(values.title),
    scopeDescription: scopeDescription || undefined,
    validFrom: trim(values.validFrom),
    validTo: validTo || undefined,
    currencyCode: currencyCode ? currencyCode.toUpperCase() : undefined,
    paymentTerms: paymentTerms || undefined,
    paymentMethod: paymentMethod || undefined,
  };
}

/** Campos nulos limpam o valor no backend (draft); omitidos preservam. */
export function buildUpdateContractDraftPayload(
  rowVersion: number,
  values: ContractFormValues,
): UpdateContractDraftPayload {
  const contractNumber = trim(values.contractNumber);
  const title = trim(values.title);
  const scopeDescription = trim(values.scopeDescription);
  const validFrom = trim(values.validFrom);
  const validTo = trim(values.validTo);
  const currencyCode = trim(values.currencyCode);
  const paymentTerms = trim(values.paymentTerms);
  const paymentMethod = trim(values.paymentMethod);
  return {
    rowVersion,
    contractNumber: contractNumber || undefined,
    title: title || undefined,
    scopeDescription: scopeDescription || null,
    validFrom: validFrom || undefined,
    validTo: validTo || null,
    currencyCode: currencyCode ? currencyCode.toUpperCase() : undefined,
    paymentTerms: paymentTerms || null,
    paymentMethod: paymentMethod || null,
  };
}

export function contractFormToValues(contract: {
  clientId: string;
  unitId: string;
  contractNumber: string;
  title: string;
  scopeDescription: string | null;
  validFrom: string;
  validTo: string | null;
  currencyCode: string;
  paymentTerms: string | null;
  paymentMethod: string | null;
}): ContractFormValues {
  return {
    clientId: contract.clientId,
    unitId: contract.unitId,
    contractNumber: contract.contractNumber,
    title: contract.title,
    scopeDescription: contract.scopeDescription ?? '',
    validFrom: contract.validFrom,
    validTo: contract.validTo ?? '',
    currencyCode: contract.currencyCode,
    paymentTerms: contract.paymentTerms ?? '',
    paymentMethod: contract.paymentMethod ?? '',
  };
}
