import { CONTACT_PURPOSES, type AddressPurpose, type ContactPurpose } from './client-status';
import { isValidCnpjFormat, normalizeCnpj } from './cnpj';

export type ClientContactInput = {
  name: string;
  purpose: ContactPurpose;
  email?: string;
  phone?: string;
};

export type ClientAddressInput = {
  purpose: AddressPurpose;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

export type CreateClientInput = {
  legalName: string;
  tradeName?: string;
  taxId: string;
  externalErpId?: string;
  contacts: ClientContactInput[];
  addresses?: ClientAddressInput[];
  notes?: string;
};

export type UpdateClientInput = {
  version: number;
  legalName?: string;
  tradeName?: string | null;
  externalErpId?: string | null;
  contacts?: ClientContactInput[];
  addresses?: ClientAddressInput[];
};

export type ClientValidationErrorCode =
  | 'LEGAL_NAME_REQUIRED'
  | 'TAX_ID_INVALID'
  | 'CONTACT_REQUIRED'
  | 'CONTACT_NOT_USABLE'
  | 'VERSION_REQUIRED'
  | 'VERSION_INVALID'
  | 'DEACTIVATION_REASON_REQUIRED';

export class ClientValidationError extends Error {
  constructor(readonly code: ClientValidationErrorCode) {
    super(code);
  }
}

const CONTACT_PURPOSE_SET = new Set<string>(Object.values(CONTACT_PURPOSES));

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isUsableContact(contact: ClientContactInput): boolean {
  return (
    isNonEmptyString(contact.name) &&
    (isNonEmptyString(contact.email) || isNonEmptyString(contact.phone))
  );
}

export function assertCreateClientInput(input: CreateClientInput): string {
  if (!isNonEmptyString(input.legalName)) {
    throw new ClientValidationError('LEGAL_NAME_REQUIRED');
  }

  const normalizedTaxId = normalizeCnpj(input.taxId);
  if (!isValidCnpjFormat(normalizedTaxId)) {
    throw new ClientValidationError('TAX_ID_INVALID');
  }

  if (!Array.isArray(input.contacts) || input.contacts.length === 0) {
    throw new ClientValidationError('CONTACT_REQUIRED');
  }

  const hasOperational = input.contacts.some(
    (contact) =>
      contact.purpose === CONTACT_PURPOSES.Operational && isUsableContact(contact),
  );
  if (!hasOperational) {
    throw new ClientValidationError('CONTACT_NOT_USABLE');
  }

  for (const contact of input.contacts) {
    if (!CONTACT_PURPOSE_SET.has(contact.purpose)) {
      throw new ClientValidationError('CONTACT_NOT_USABLE');
    }
    if (!isNonEmptyString(contact.name)) {
      throw new ClientValidationError('CONTACT_NOT_USABLE');
    }
  }

  return normalizedTaxId;
}

export function assertUpdateClientInput(input: UpdateClientInput): void {
  if (!Number.isInteger(input.version) || input.version < 1) {
    throw new ClientValidationError('VERSION_INVALID');
  }

  if (input.legalName !== undefined && !isNonEmptyString(input.legalName)) {
    throw new ClientValidationError('LEGAL_NAME_REQUIRED');
  }

  if (input.contacts !== undefined) {
    if (input.contacts.length === 0) {
      throw new ClientValidationError('CONTACT_REQUIRED');
    }
    const hasOperational = input.contacts.some(
      (contact) =>
        contact.purpose === CONTACT_PURPOSES.Operational && isUsableContact(contact),
    );
    if (!hasOperational) {
      throw new ClientValidationError('CONTACT_NOT_USABLE');
    }
  }
}

export function assertDeactivationReason(reason: string | undefined): void {
  if (!isNonEmptyString(reason)) {
    throw new ClientValidationError('DEACTIVATION_REASON_REQUIRED');
  }
}
