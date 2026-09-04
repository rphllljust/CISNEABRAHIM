import { isValidCnpjFormat, normalizeCnpj } from '../../clients/domain/cnpj';

/**
 * Legal Establishment Master — domínio puro do cadastro da própria empresa
 * emissora (LegalEntity / Establishment / TaxRegistration / Certificate).
 * Interpretação de engenharia, sem dados empresariais hardcoded.
 */

export const LEGAL_ENTITY_STATUSES = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const;

export type LegalEntityStatus =
  (typeof LEGAL_ENTITY_STATUSES)[keyof typeof LEGAL_ENTITY_STATUSES];

export const ESTABLISHMENT_STATUSES = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const;

export type EstablishmentStatus =
  (typeof ESTABLISHMENT_STATUSES)[keyof typeof ESTABLISHMENT_STATUSES];

export const TAX_REGISTRATION_KINDS = {
  Cnpj: 'CNPJ',
  Ie: 'IE',
  Im: 'IM',
} as const;

export type TaxRegistrationKind =
  (typeof TAX_REGISTRATION_KINDS)[keyof typeof TAX_REGISTRATION_KINDS];

export const TAX_REGISTRATION_STATUSES = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const;

export type TaxRegistrationStatus =
  (typeof TAX_REGISTRATION_STATUSES)[keyof typeof TAX_REGISTRATION_STATUSES];

export const TAX_REGIMES = {
  SimplesNacional: 'SIMPLES_NACIONAL',
  Mei: 'MEI',
  LucroPresumido: 'LUCRO_PRESUMIDO',
  LucroReal: 'LUCRO_REAL',
} as const;

export type TaxRegime = (typeof TAX_REGIMES)[keyof typeof TAX_REGIMES];

export const CERTIFICATE_KINDS = {
  A1: 'A1',
  A3: 'A3',
} as const;

export type CertificateKind = (typeof CERTIFICATE_KINDS)[keyof typeof CERTIFICATE_KINDS];

export const CERTIFICATE_STATUSES = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const;

export type CertificateStatus =
  (typeof CERTIFICATE_STATUSES)[keyof typeof CERTIFICATE_STATUSES];

export class LegalEstablishmentError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export function isLegalEntityStatus(value: unknown): value is LegalEntityStatus {
  return (
    value === LEGAL_ENTITY_STATUSES.Active || value === LEGAL_ENTITY_STATUSES.Inactive
  );
}

export function isEstablishmentStatus(value: unknown): value is EstablishmentStatus {
  return (
    value === ESTABLISHMENT_STATUSES.Active || value === ESTABLISHMENT_STATUSES.Inactive
  );
}

export function isTaxRegistrationKind(value: unknown): value is TaxRegistrationKind {
  return (
    value === TAX_REGISTRATION_KINDS.Cnpj ||
    value === TAX_REGISTRATION_KINDS.Ie ||
    value === TAX_REGISTRATION_KINDS.Im
  );
}

export function isTaxRegistrationStatus(value: unknown): value is TaxRegistrationStatus {
  return (
    value === TAX_REGISTRATION_STATUSES.Active ||
    value === TAX_REGISTRATION_STATUSES.Inactive
  );
}

export function isTaxRegime(value: unknown): value is TaxRegime {
  return Object.values(TAX_REGIMES).includes(value as TaxRegime);
}

export function isCertificateKind(value: unknown): value is CertificateKind {
  return value === CERTIFICATE_KINDS.A1 || value === CERTIFICATE_KINDS.A3;
}

export function isCertificateStatus(value: unknown): value is CertificateStatus {
  return (
    value === CERTIFICATE_STATUSES.Active || value === CERTIFICATE_STATUSES.Inactive
  );
}

const IE_PATTERN = /^[A-Z0-9]{2,20}$/;
const IM_PATTERN = /^[0-9]{1,20}$/;

export function normalizeTaxNumber(kind: TaxRegistrationKind, value: string): string {
  const trimmed = value.trim();
  if (kind === TAX_REGISTRATION_KINDS.Cnpj) {
    return normalizeCnpj(trimmed);
  }
  if (kind === TAX_REGISTRATION_KINDS.Ie) {
    return trimmed.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  return trimmed.replace(/\D/g, '');
}

export function isValidTaxNumberFormat(kind: TaxRegistrationKind, value: string): boolean {
  const normalized = normalizeTaxNumber(kind, value);
  if (kind === TAX_REGISTRATION_KINDS.Cnpj) {
    return isValidCnpjFormat(normalized);
  }
  if (kind === TAX_REGISTRATION_KINDS.Ie) {
    return IE_PATTERN.test(normalized);
  }
  return IM_PATTERN.test(normalized);
}

/** Máquina de inativação: somente ACTIVE pode ir para INACTIVE (e vice-versa). */
export function assertStatusTransition(
  current: LegalEntityStatus | EstablishmentStatus | TaxRegistrationStatus,
  next: LegalEntityStatus | EstablishmentStatus | TaxRegistrationStatus,
): void {
  if (current === next) {
    throw new LegalEstablishmentError('LEGAL_ESTABLISHMENT_SAME_STATUS');
  }
  if (
    current === 'ACTIVE' &&
    next === 'INACTIVE'
  ) {
    return;
  }
  if (
    current === 'INACTIVE' &&
    next === 'ACTIVE'
  ) {
    return;
  }
  throw new LegalEstablishmentError('LEGAL_ESTABLISHMENT_INVALID_STATUS_TRANSITION');
}

export type FiscalAddressInput = {
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};
