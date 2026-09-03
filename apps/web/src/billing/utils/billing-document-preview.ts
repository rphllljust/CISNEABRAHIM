import type { BillingDocumentItem, BillingRecordDetail } from '../types/billing.types';
import { formatAddressLine } from './billing-document-format';

export const BILLING_EMITTER_PREVIEW = {
  legalName: 'CISNE RONDÔNIA COMÉRCIO E SERVIÇOS LTDA',
  taxId: '11897171000181',
  address: {
    street: 'Av. Sete de Setembro',
    city: 'Porto Velho',
    state: 'RO',
    postalCode: '76801000',
  },
  documentCategory: 'NOTA FATURA',
  fiscalDisclaimer:
    'Faturamento interno da Release 1. Documento de cobrança operacional. Não constitui NF-e, NFS-e nem documento fiscal oficial autorizado.',
} as const;

export type BillingDocumentPreviewModel = {
  documentNumberLabel: string;
  documentCategory: string;
  fiscalDisclaimer: string;
  emitterLegalName: string;
  emitterTaxId: string;
  emitterAddressLine: string;
  clientLegalName: string;
  clientTaxId: string | null;
  billingAddressLine: string;
  paymentTerms: string;
  dueDate: string | null;
  currencyCode: string;
  totalAmount: string;
  purchaseOrderNumber: string | null;
  contractReference: string | null;
  commercialReferenceLabel: string;
  items: BillingDocumentItem[];
};

export function buildBillingDocumentPreview(
  billing: BillingRecordDetail,
  options: {
    dueDate?: string | null;
    documentNumber?: string | null;
    purchaseOrderNumber?: string | null;
    commercialReferenceLabel: string;
  },
): BillingDocumentPreviewModel {
  return {
    documentNumberLabel: options.documentNumber?.trim() || 'Atribuído na emissão',
    documentCategory: BILLING_EMITTER_PREVIEW.documentCategory,
    fiscalDisclaimer: BILLING_EMITTER_PREVIEW.fiscalDisclaimer,
    emitterLegalName: BILLING_EMITTER_PREVIEW.legalName,
    emitterTaxId: BILLING_EMITTER_PREVIEW.taxId,
    emitterAddressLine: formatAddressLine(BILLING_EMITTER_PREVIEW.address),
    clientLegalName: billing.clientLegalNameSnapshot,
    clientTaxId: billing.clientTaxIdSnapshot,
    billingAddressLine: formatAddressLine(billing.billingAddressSnapshot),
    paymentTerms: billing.paymentTerms,
    dueDate: options.dueDate ?? null,
    currencyCode: billing.currencyCode,
    totalAmount: billing.totalAmount,
    purchaseOrderNumber: options.purchaseOrderNumber ?? null,
    contractReference: billing.contractReference,
    commercialReferenceLabel: options.commercialReferenceLabel,
    items: billing.items.map((item) => ({
      id: item.id,
      lineNumber: item.lineNumber,
      billingItemId: item.id,
      measurementItemId: item.measurementItemId,
      unitCode: item.unitCode,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineAmount: item.lineAmount,
      lineLabel: item.lineLabel,
      pricingLineSnapshot: item.pricingLineSnapshot,
    })),
  };
}

export function resolveBillingRecordTermsDivergence(
  billing: BillingRecordDetail,
): { authoritativeValue: string; declaredValue: string } | null {
  const authoritative = billing.paymentTermsAuthoritative?.trim();
  if (!authoritative) {
    return null;
  }
  const declared = billing.paymentTerms.trim();
  if (!declared) {
    return null;
  }
  if (declared.toLowerCase().replace(/\s+/g, ' ') === authoritative.toLowerCase().replace(/\s+/g, ' ')) {
    return null;
  }
  return { authoritativeValue: authoritative, declaredValue: declared };
}

export function hasActiveFinalizedDocument(
  documents: Array<{ status: string }>,
): boolean {
  return documents.some((doc) => doc.status === 'FINALIZED');
}
