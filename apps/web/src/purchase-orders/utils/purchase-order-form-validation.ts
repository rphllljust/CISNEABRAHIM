import {
  PURCHASE_ORDER_PRICING_STRUCTURES,
  type CreatePurchaseOrderPayload,
  type PurchaseOrderPricingStructure,
} from '../types/purchase-order.types';

export type PurchaseOrderFormValues = {
  clientId: string;
  unitId: string;
  poNumber: string;
  rcNumber: string;
  issueDate: string;
  serviceManager: string;
  currencyCode: string;
  pricingStructure: PurchaseOrderPricingStructure;
  totalAmount: string;
  paymentTerms: string;
  paymentMethod: string;
  itemDescription: string;
  itemLineTotal: string;
};

export type PurchaseOrderFormFieldErrors = Partial<Record<keyof PurchaseOrderFormValues, string>>;

export const EMPTY_PURCHASE_ORDER_FORM: PurchaseOrderFormValues = {
  clientId: '',
  unitId: '',
  poNumber: '',
  rcNumber: '',
  issueDate: '',
  serviceManager: '',
  currencyCode: 'BRL',
  pricingStructure: PURCHASE_ORDER_PRICING_STRUCTURES.LineItems,
  totalAmount: '',
  paymentTerms: '',
  paymentMethod: '',
  itemDescription: '',
  itemLineTotal: '',
};

export function validatePurchaseOrderForm(
  values: PurchaseOrderFormValues,
): PurchaseOrderFormFieldErrors {
  const errors: PurchaseOrderFormFieldErrors = {};

  if (!values.clientId.trim()) {
    errors.clientId = 'Selecione um cliente.';
  }
  if (!values.unitId.trim()) {
    errors.unitId = 'Informe a unidade operacional.';
  }
  if (!values.poNumber.trim()) {
    errors.poNumber = 'Informe o número do pedido de compra.';
  }

  if (values.pricingStructure === PURCHASE_ORDER_PRICING_STRUCTURES.HeaderTotal) {
    if (!values.totalAmount.trim()) {
      errors.totalAmount = 'Informe o valor total autorizado.';
    }
  }

  if (values.pricingStructure === PURCHASE_ORDER_PRICING_STRUCTURES.LineItems) {
    if (!values.itemDescription.trim()) {
      errors.itemDescription = 'Informe a descrição do item.';
    }
    if (!values.itemLineTotal.trim()) {
      errors.itemLineTotal = 'Informe o total da linha.';
    }
  }

  return errors;
}

export function buildCreatePurchaseOrderPayload(
  values: PurchaseOrderFormValues,
): CreatePurchaseOrderPayload {
  const payload: CreatePurchaseOrderPayload = {
    clientId: values.clientId.trim(),
    unitId: values.unitId.trim(),
    poNumber: values.poNumber.trim(),
    pricingStructure: values.pricingStructure,
    currencyCode: values.currencyCode.trim() || 'BRL',
    rcNumber: values.rcNumber.trim() || undefined,
    issueDate: values.issueDate.trim() || undefined,
    serviceManager: values.serviceManager.trim() || undefined,
    paymentTerms: values.paymentTerms.trim() || undefined,
    paymentMethod: values.paymentMethod.trim() || undefined,
  };

  if (values.pricingStructure === PURCHASE_ORDER_PRICING_STRUCTURES.HeaderTotal) {
    payload.totalAmount = values.totalAmount.trim();
  }

  if (values.pricingStructure === PURCHASE_ORDER_PRICING_STRUCTURES.LineItems) {
    payload.items = [
      {
        lineNumber: 1,
        description: values.itemDescription.trim(),
        lineTotal: values.itemLineTotal.trim(),
      },
    ];
  }

  return payload;
}

export function buildUpdatePurchaseOrderPayload(
  values: PurchaseOrderFormValues,
  rowVersion: number,
) {
  return {
    rowVersion,
    poNumber: values.poNumber.trim(),
    rcNumber: values.rcNumber.trim() || null,
    issueDate: values.issueDate.trim() || null,
    serviceManager: values.serviceManager.trim() || null,
    currencyCode: values.currencyCode.trim() || 'BRL',
    pricingStructure: values.pricingStructure,
    totalAmount:
      values.pricingStructure === PURCHASE_ORDER_PRICING_STRUCTURES.HeaderTotal
        ? values.totalAmount.trim()
        : null,
    paymentTerms: values.paymentTerms.trim() || null,
    paymentMethod: values.paymentMethod.trim() || null,
    items:
      values.pricingStructure === PURCHASE_ORDER_PRICING_STRUCTURES.LineItems
        ? [
            {
              lineNumber: 1,
              description: values.itemDescription.trim(),
              lineTotal: values.itemLineTotal.trim(),
            },
          ]
        : undefined,
  };
}
