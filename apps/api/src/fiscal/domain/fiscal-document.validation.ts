import { assertCurrencyCode } from '../../platform/kernel/money-math';
import { assertUuid } from '../../platform/kernel/uuid';
import {
  assertItems,
  assertParties,
  assertSourceKind,
  assertTaxDetails,
  type FiscalItemDraft,
  type FiscalPartyDraft,
  type FiscalTaxDetailDraft,
} from './fiscal-document';

export class FiscalValidationError extends Error {
  constructor(readonly field: string) {
    super(field);
  }
}

export type CreateFiscalDocumentInput = {
  unitId: string;
  sourceKind: string;
  sourceId?: string;
  billingDocumentId?: string;
  /** Estabelecimento emissor (registry da própria empresa). Obrigatório na emissão nova. */
  establishmentId?: string;
  description: string;
  currencyCode: string;
  issuedOn: string;
  certificateRef?: string;
  idempotencyKey: string;
  parties: FiscalPartyDraft[];
  items: FiscalItemDraft[];
  taxDetails?: FiscalTaxDetailDraft[];
};

function requireNonEmpty(value: string | undefined | null, field: string): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    throw new FiscalValidationError(field);
  }
  return trimmed;
}

function requireDate(value: string | undefined | null, field: string): string {
  const trimmed = value?.trim() ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed) && !/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    throw new FiscalValidationError(field);
  }
  return trimmed.slice(0, 10);
}

export function validateCreateFiscalDocumentInput(
  input: CreateFiscalDocumentInput,
): CreateFiscalDocumentInput {
  const sourceKind = assertSourceKind(requireNonEmpty(input.sourceKind, 'sourceKind'));
  if (input.sourceId) {
    assertUuid(input.sourceId, 'sourceId');
  }
  if (input.billingDocumentId) {
    assertUuid(input.billingDocumentId, 'billingDocumentId');
  }
  if (input.establishmentId) {
    assertUuid(input.establishmentId, 'establishmentId');
  }
  const parties = input.parties ?? [];
  const items = input.items ?? [];
  const taxDetails = input.taxDetails ?? [];
  assertParties(parties, { requireIssuer: input.establishmentId ? false : true });
  assertItems(items);
  assertTaxDetails(taxDetails);
  return {
    unitId: requireNonEmpty(input.unitId, 'unitId'),
    sourceKind,
    sourceId: input.sourceId,
    billingDocumentId: input.billingDocumentId,
    establishmentId: input.establishmentId,
    description: requireNonEmpty(input.description, 'description'),
    currencyCode: assertCurrencyCode(input.currencyCode),
    issuedOn: requireDate(input.issuedOn, 'issuedOn'),
    certificateRef: input.certificateRef?.trim() || undefined,
    idempotencyKey: requireNonEmpty(input.idempotencyKey, 'idempotencyKey'),
    parties,
    items,
    taxDetails,
  };
}

export function validateCancelInput(input: { rowVersion: number; reason: string }): {
  rowVersion: number;
  reason: string;
} {
  if (!Number.isInteger(input.rowVersion) || input.rowVersion < 1) {
    throw new FiscalValidationError('rowVersion');
  }
  return { rowVersion: input.rowVersion, reason: requireNonEmpty(input.reason, 'reason') };
}
