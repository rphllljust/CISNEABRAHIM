import { normalizeMoneyAmount, parseOptionalMoneyAmount } from './money';
import {
  isContractDocumentLinkPurpose,
  type ContractDocumentLinkPurpose,
} from './contract';

export type ContractItemInput = {
  lineNumber: number;
  description: string;
  serviceDefinitionId?: string;
  serviceDefinitionVersionId?: string;
  quantity?: string;
  unitCode?: string;
  unitPrice?: string;
  lineTotal?: string;
};

export type CreateContractInput = {
  clientId: string;
  unitId: string;
  contractNumber: string;
  title: string;
  scopeDescription?: string;
  validFrom: string;
  validTo?: string;
  currencyCode?: string;
  paymentTerms?: string;
  paymentMethod?: string;
  commercialTerms?: Record<string, unknown>;
  items?: ContractItemInput[];
};

export type UpdateContractDraftInput = {
  rowVersion: number;
  contractNumber?: string;
  title?: string;
  scopeDescription?: string | null;
  validFrom?: string;
  validTo?: string | null;
  currencyCode?: string;
  paymentTerms?: string | null;
  paymentMethod?: string | null;
  commercialTerms?: Record<string, unknown>;
  items?: ContractItemInput[];
};

export type CloseContractInput = {
  rowVersion: number;
  closureReason?: string;
};

export type LinkContractDocumentInput = {
  documentId: string;
  linkPurpose: string;
};

export class ContractValidationError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseRequiredIsoDate(value: string, code: string): string {
  const trimmed = value?.trim();
  if (!trimmed || !ISO_DATE_PATTERN.test(trimmed)) {
    throw new ContractValidationError(code);
  }
  return trimmed;
}

function parseOptionalIsoDate(value: string | null | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (!ISO_DATE_PATTERN.test(trimmed)) {
    throw new ContractValidationError('INVALID_DATE');
  }
  return trimmed;
}

function assertValidityRange(validFrom: string, validTo: string | null | undefined): void {
  if (validTo && validTo < validFrom) {
    throw new ContractValidationError('INVALID_VALIDITY_RANGE');
  }
}

function multiplyMoney(quantity: string, unitPrice: string): string {
  const qtyParts = quantity.split('.');
  const priceParts = unitPrice.split('.');
  const qtyWhole = BigInt(qtyParts[0] ?? '0');
  const qtyFrac = (qtyParts[1] ?? '').padEnd(4, '0').slice(0, 4);
  const priceWhole = BigInt(priceParts[0] ?? '0');
  const priceFrac = (priceParts[1] ?? '').padEnd(4, '0').slice(0, 4);
  const qtyScaled = qtyWhole * 10000n + BigInt(qtyFrac || '0');
  const priceScaled = priceWhole * 10000n + BigInt(priceFrac || '0');
  const product = qtyScaled * priceScaled;
  const whole = product / 100000000n;
  const frac = (product % 100000000n).toString().padStart(8, '0').slice(0, 4);
  return normalizeMoneyAmount(`${whole}.${frac}`);
}

function parseItems(items: ContractItemInput[] | undefined): ContractItemInput[] {
  if (!items || items.length === 0) {
    return [];
  }
  return items.map((item, index) => {
    const description = item.description?.trim();
    if (!description) {
      throw new ContractValidationError('INVALID_ITEM_DESCRIPTION');
    }
    const lineNumber = item.lineNumber ?? index + 1;
    if (!Number.isInteger(lineNumber) || lineNumber < 1) {
      throw new ContractValidationError('INVALID_LINE_NUMBER');
    }
    const quantity = item.quantity ? normalizeMoneyAmount(item.quantity) : undefined;
    const unitPrice = parseOptionalMoneyAmount(item.unitPrice) ?? undefined;
    const lineTotal = parseOptionalMoneyAmount(item.lineTotal) ?? undefined;

    if (quantity && unitPrice && lineTotal) {
      const expected = multiplyMoney(quantity, unitPrice);
      if (expected !== lineTotal) {
        throw new ContractValidationError('LINE_TOTAL_MISMATCH');
      }
    }

    return {
      ...item,
      lineNumber,
      description,
      quantity,
      unitPrice,
      lineTotal,
      unitCode: item.unitCode?.trim().toUpperCase() || undefined,
    };
  });
}

export function validateCreateContractInput(input: CreateContractInput): {
  contractNumber: string;
  title: string;
  scopeDescription: string | null;
  validFrom: string;
  validTo: string | null;
  currencyCode: string;
  items: ContractItemInput[];
  commercialTerms: Record<string, unknown>;
} {
  const contractNumber = input.contractNumber?.trim();
  if (!contractNumber) {
    throw new ContractValidationError('CONTRACT_NUMBER_REQUIRED');
  }
  const title = input.title?.trim();
  if (!title) {
    throw new ContractValidationError('TITLE_REQUIRED');
  }
  const validFrom = parseRequiredIsoDate(input.validFrom, 'VALID_FROM_REQUIRED');
  const validTo = parseOptionalIsoDate(input.validTo) ?? null;
  assertValidityRange(validFrom, validTo);

  const currencyCode = (input.currencyCode ?? 'BRL').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currencyCode)) {
    throw new ContractValidationError('INVALID_CURRENCY_CODE');
  }

  return {
    contractNumber,
    title,
    scopeDescription: input.scopeDescription?.trim() || null,
    validFrom,
    validTo,
    currencyCode,
    items: parseItems(input.items),
    commercialTerms: input.commercialTerms ?? {},
  };
}

export function validateUpdateContractDraftInput(
  input: UpdateContractDraftInput,
): UpdateContractDraftInput {
  if (!Number.isInteger(input.rowVersion) || input.rowVersion < 1) {
    throw new ContractValidationError('INVALID_ROW_VERSION');
  }

  const validFrom = input.validFrom ? parseRequiredIsoDate(input.validFrom, 'INVALID_DATE') : undefined;
  const validTo = parseOptionalIsoDate(input.validTo);
  if (validFrom !== undefined && validTo !== undefined && validTo !== null && validTo < validFrom) {
    throw new ContractValidationError('INVALID_VALIDITY_RANGE');
  }

  if (input.currencyCode && !/^[A-Z]{3}$/.test(input.currencyCode.trim().toUpperCase())) {
    throw new ContractValidationError('INVALID_CURRENCY_CODE');
  }

  return {
    ...input,
    contractNumber: input.contractNumber?.trim(),
    title: input.title?.trim(),
    scopeDescription:
      input.scopeDescription === null
        ? null
        : input.scopeDescription?.trim() || undefined,
    validFrom,
    validTo,
    items: input.items ? parseItems(input.items) : undefined,
    commercialTerms: input.commercialTerms,
  };
}

export function validateCloseContractInput(input: CloseContractInput): CloseContractInput {
  if (!Number.isInteger(input.rowVersion) || input.rowVersion < 1) {
    throw new ContractValidationError('INVALID_ROW_VERSION');
  }
  return {
    ...input,
    closureReason: input.closureReason?.trim() || undefined,
  };
}

export function validateLinkContractDocumentInput(
  input: LinkContractDocumentInput,
): { documentId: string; linkPurpose: ContractDocumentLinkPurpose } {
  if (!input.documentId?.trim()) {
    throw new ContractValidationError('DOCUMENT_ID_REQUIRED');
  }
  const linkPurpose = input.linkPurpose?.trim().toUpperCase();
  if (!linkPurpose || !isContractDocumentLinkPurpose(linkPurpose)) {
    throw new ContractValidationError('INVALID_LINK_PURPOSE');
  }
  return {
    documentId: input.documentId.trim(),
    linkPurpose,
  };
}

export function validateActivateContractInput(input: {
  rowVersion: number;
}): { rowVersion: number } {
  if (!Number.isInteger(input.rowVersion) || input.rowVersion < 1) {
    throw new ContractValidationError('INVALID_ROW_VERSION');
  }
  return input;
}
