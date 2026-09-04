/**
 * Own Company Bootstrap — carrega o cadastro da própria empresa (Legal Entity,
 * Establishment MATRIZ e TaxRegistration CNPJ) a partir de variáveis de
 * ambiente, SEM valores hardcoded. Os dados confirmados vêm da fonte oficial
 * (SRC-005); a função apenas mapeia env → inputs do registry e nunca contém a
 * razão social/CNPJ literal.
 */

import { isValidTaxNumberFormat, normalizeTaxNumber, TAX_REGISTRATION_KINDS } from './legal-establishment';
import {
  OwnCompanyBootstrapError,
  OWN_COMPANY_BOOTSTRAP_ERROR_CODES,
} from './own-company-bootstrap-errors';

export type OwnCompanyBootstrapEnv = {
  OWN_COMPANY_LEGAL_NAME?: string;
  OWN_COMPANY_TRADE_NAME?: string;
  OWN_COMPANY_ESTABLISHMENT_CODE?: string;
  OWN_COMPANY_CNPJ?: string;
  OWN_COMPANY_STREET?: string;
  OWN_COMPANY_NUMBER?: string;
  OWN_COMPANY_COMPLEMENT?: string;
  OWN_COMPANY_DISTRICT?: string;
  OWN_COMPANY_CITY?: string;
  OWN_COMPANY_STATE?: string;
  OWN_COMPANY_POSTAL_CODE?: string;
  OWN_COMPANY_COUNTRY?: string;
};

export type OwnCompanyBootstrapConfig = {
  legalName: string;
  tradeName: string | null;
  establishmentCode: string;
  normalizedCnpj: string;
  address: {
    street: string | null;
    number: string | null;
    complement: string | null;
    district: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  };
};

function optional(value: string | undefined, fallback: string | null = null): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : fallback;
}

/** Mapeia env → configuração do registry (sem valores literais da empresa). */
export function buildOwnCompanyBootstrapConfig(env: OwnCompanyBootstrapEnv): OwnCompanyBootstrapConfig {
  const legalName = env.OWN_COMPANY_LEGAL_NAME?.trim() ?? '';
  const cnpj = env.OWN_COMPANY_CNPJ?.trim() ?? '';
  if (!legalName) {
    throw new OwnCompanyBootstrapError(OWN_COMPANY_BOOTSTRAP_ERROR_CODES.MISSING_REQUIRED);
  }
  if (!isValidTaxNumberFormat(TAX_REGISTRATION_KINDS.Cnpj, cnpj)) {
    throw new OwnCompanyBootstrapError(OWN_COMPANY_BOOTSTRAP_ERROR_CODES.INVALID_CNPJ);
  }
  return {
    legalName,
    tradeName: optional(env.OWN_COMPANY_TRADE_NAME),
    establishmentCode: optional(env.OWN_COMPANY_ESTABLISHMENT_CODE, 'MATRIZ')!,
    normalizedCnpj: normalizeTaxNumber(TAX_REGISTRATION_KINDS.Cnpj, cnpj),
    address: {
      street: optional(env.OWN_COMPANY_STREET),
      number: optional(env.OWN_COMPANY_NUMBER),
      complement: optional(env.OWN_COMPANY_COMPLEMENT),
      district: optional(env.OWN_COMPANY_DISTRICT),
      city: optional(env.OWN_COMPANY_CITY),
      state: optional(env.OWN_COMPANY_STATE)?.toUpperCase() ?? null,
      postalCode: optional(env.OWN_COMPANY_POSTAL_CODE),
      country: optional(env.OWN_COMPANY_COUNTRY, 'BR')?.toUpperCase() ?? 'BR',
    },
  };
}

/** O estabelecimento emissor do registry deve existir apenas uma vez por código. */
export function assertEstablishmentNotAlreadySeeded(existingCodes: readonly string[], code: string): void {
  if (existingCodes.includes(code)) {
    throw new OwnCompanyBootstrapError(OWN_COMPANY_BOOTSTRAP_ERROR_CODES.MISSING_REQUIRED);
  }
}
