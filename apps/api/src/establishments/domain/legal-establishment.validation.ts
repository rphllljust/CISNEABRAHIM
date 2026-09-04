import { LegalEstablishmentError } from './legal-establishment';

export type CreateLegalEntityInput = {
  legalName: string;
  tradeName?: string | null;
};

export type UpdateLegalEntityInput = {
  version: number;
  legalName?: string;
  tradeName?: string | null;
};

export type CreateEstablishmentInput = {
  legalEntityId: string;
  code: string;
  tradeName?: string | null;
  isDefaultIssuer?: boolean;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

export type UpdateEstablishmentInput = {
  version: number;
  tradeName?: string | null;
  isDefaultIssuer?: boolean;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

export type CreateTaxRegistrationInput = {
  establishmentId: string;
  taxKind: 'CNPJ' | 'IE' | 'IM';
  number: string;
  state?: string | null;
  regime?: 'SIMPLES_NACIONAL' | 'MEI' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' | null;
  validFrom?: string | null;
  validTo?: string | null;
  authority?: string | null;
};

export type UpdateTaxRegistrationInput = {
  version: number;
  state?: string | null;
  regime?: 'SIMPLES_NACIONAL' | 'MEI' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' | null;
  validFrom?: string | null;
  validTo?: string | null;
  authority?: string | null;
};

export type CreateCertificateInput = {
  establishmentId: string;
  certificateKind: 'A1' | 'A3';
  label: string;
  subjectRef?: string | null;
  issuerRef?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
};

export type UpdateCertificateInput = {
  certificateKind?: 'A1' | 'A3';
  label?: string;
  subjectRef?: string | null;
  issuerRef?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
};

export type StatusTransitionInput = {
  version: number;
  reason?: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function optionalTrimmed(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new LegalEstablishmentError('LEGAL_ESTABLISHMENT_INVALID_INPUT');
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalNullableString(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }
  return optionalTrimmed(value);
}

function assertPositiveVersion(version: unknown): number {
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new LegalEstablishmentError('LEGAL_ESTABLISHMENT_INVALID_VERSION');
  }
  return version;
}

function assertOptionalPostalCode(value: string | null | undefined): string | null | undefined {
  if (value === null) {
    return null;
  }
  if (value !== undefined && !/^[0-9]{8}$/.test(value)) {
    throw new LegalEstablishmentError('LEGAL_ESTABLISHMENT_INVALID_POSTAL_CODE');
  }
  return value;
}

export function validateCreateLegalEntityInput(input: CreateLegalEntityInput): void {
  if (!isNonEmptyString(input.legalName)) {
    throw new LegalEstablishmentError('LEGAL_ENTITY_LEGAL_NAME_REQUIRED');
  }
}

export function validateUpdateLegalEntityInput(input: UpdateLegalEntityInput): void {
  assertPositiveVersion(input.version);
  if (input.legalName !== undefined && !isNonEmptyString(input.legalName)) {
    throw new LegalEstablishmentError('LEGAL_ENTITY_LEGAL_NAME_REQUIRED');
  }
}

export function validateCreateEstablishmentInput(input: CreateEstablishmentInput): void {
  if (!isNonEmptyString(input.legalEntityId)) {
    throw new LegalEstablishmentError('ESTABLISHMENT_LEGAL_ENTITY_REQUIRED');
  }
  if (!isNonEmptyString(input.code)) {
    throw new LegalEstablishmentError('ESTABLISHMENT_CODE_REQUIRED');
  }
  assertOptionalPostalCode(input.postalCode ?? undefined);
}

export function validateUpdateEstablishmentInput(input: UpdateEstablishmentInput): void {
  assertPositiveVersion(input.version);
  assertOptionalPostalCode(input.postalCode ?? undefined);
}

export function validateCreateTaxRegistrationInput(
  input: CreateTaxRegistrationInput,
): void {
  if (!isNonEmptyString(input.establishmentId)) {
    throw new LegalEstablishmentError('TAX_REGISTRATION_ESTABLISHMENT_REQUIRED');
  }
  if (!isNonEmptyString(input.number)) {
    throw new LegalEstablishmentError('TAX_REGISTRATION_NUMBER_REQUIRED');
  }
}

export function validateUpdateTaxRegistrationInput(input: UpdateTaxRegistrationInput): void {
  assertPositiveVersion(input.version);
}

export function validateStatusTransitionInput(input: StatusTransitionInput): void {
  assertPositiveVersion(input.version);
}

export function validateCreateCertificateInput(input: CreateCertificateInput): void {
  if (!isNonEmptyString(input.establishmentId)) {
    throw new LegalEstablishmentError('CERTIFICATE_ESTABLISHMENT_REQUIRED');
  }
  if (!isNonEmptyString(input.label)) {
    throw new LegalEstablishmentError('CERTIFICATE_LABEL_REQUIRED');
  }
  if (input.certificateKind !== 'A1' && input.certificateKind !== 'A3') {
    throw new LegalEstablishmentError('CERTIFICATE_INVALID_KIND');
  }
}

export function validateUpdateCertificateInput(input: UpdateCertificateInput): void {
  if (input.label !== undefined && !isNonEmptyString(input.label)) {
    throw new LegalEstablishmentError('CERTIFICATE_LABEL_REQUIRED');
  }
  if (
    input.certificateKind !== undefined &&
    input.certificateKind !== 'A1' &&
    input.certificateKind !== 'A3'
  ) {
    throw new LegalEstablishmentError('CERTIFICATE_INVALID_KIND');
  }
}

export function normalizeNullableStrings<T extends Record<string, unknown>>(
  input: T,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    out[key] = optionalNullableString(value);
  }
  return out;
}
