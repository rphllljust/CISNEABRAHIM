import {
  PROPOSAL_PRICING_STRUCTURES,
  type CreateProposalPayload,
  type ProposalItemInput,
  type ProposalPricingStructure,
} from '../types/proposal.types';

export type ProposalFormValues = {
  clientId: string;
  unitId: string;
  title: string;
  pricingStructure: ProposalPricingStructure;
  currencyCode: string;
  globalSalePrice: string;
  validUntil: string;
  notes: string;
  itemDescription: string;
  itemLineSaleAmount: string;
};

export type ProposalFormFieldErrors = Partial<Record<keyof ProposalFormValues, string>>;

export const EMPTY_PROPOSAL_FORM: ProposalFormValues = {
  clientId: '',
  unitId: '',
  title: '',
  pricingStructure: PROPOSAL_PRICING_STRUCTURES.GlobalPrice,
  currencyCode: 'BRL',
  globalSalePrice: '',
  validUntil: '',
  notes: '',
  itemDescription: '',
  itemLineSaleAmount: '',
};

export function validateProposalForm(
  values: ProposalFormValues,
  mode: 'create' | 'edit',
): ProposalFormFieldErrors {
  const errors: ProposalFormFieldErrors = {};

  if (!values.clientId.trim()) {
    errors.clientId = 'Selecione um cliente.';
  }
  if (!values.unitId.trim()) {
    errors.unitId = 'Informe a unidade operacional.';
  }
  if (!values.title.trim()) {
    errors.title = 'Informe o título da proposta.';
  }

  if (values.pricingStructure === PROPOSAL_PRICING_STRUCTURES.GlobalPrice) {
    if (!values.globalSalePrice.trim()) {
      errors.globalSalePrice = 'Informe o preço global de venda.';
    }
  }

  if (values.pricingStructure === PROPOSAL_PRICING_STRUCTURES.Itemized) {
    if (!values.itemDescription.trim()) {
      errors.itemDescription = 'Informe a descrição do item.';
    }
    if (!values.itemLineSaleAmount.trim()) {
      errors.itemLineSaleAmount = 'Informe o valor de venda do item.';
    }
  }

  if (mode === 'create' && Object.keys(errors).length > 0) {
    return errors;
  }

  return errors;
}

function buildItems(values: ProposalFormValues): ProposalItemInput[] | undefined {
  if (values.pricingStructure !== PROPOSAL_PRICING_STRUCTURES.Itemized) {
    return undefined;
  }
  return [
    {
      lineNumber: 1,
      description: values.itemDescription.trim(),
      lineSaleAmount: values.itemLineSaleAmount.trim(),
    },
  ];
}

export function buildCreateProposalPayload(values: ProposalFormValues): CreateProposalPayload {
  return {
    clientId: values.clientId.trim(),
    unitId: values.unitId.trim(),
    title: values.title.trim(),
    pricingStructure: values.pricingStructure,
    currencyCode: values.currencyCode.trim() || 'BRL',
    globalSalePrice:
      values.pricingStructure === PROPOSAL_PRICING_STRUCTURES.GlobalPrice
        ? values.globalSalePrice.trim()
        : undefined,
    validUntil: values.validUntil.trim() || undefined,
    notes: values.notes.trim() || undefined,
    items: buildItems(values),
  };
}

export function buildUpdateProposalPayload(
  values: ProposalFormValues,
  rowVersion: number,
) {
  return {
    rowVersion,
    title: values.title.trim(),
    pricingStructure: values.pricingStructure,
    currencyCode: values.currencyCode.trim() || 'BRL',
    globalSalePrice:
      values.pricingStructure === PROPOSAL_PRICING_STRUCTURES.GlobalPrice
        ? values.globalSalePrice.trim()
        : null,
    validUntil: values.validUntil.trim() || null,
    notes: values.notes.trim() || null,
    items: buildItems(values),
  };
}
