import { FiscalError } from './fiscal-document';

/**
 * SRC-007 / BR-043..BR-045. Default production snapshot is SRC-006 NÃO CREDENCIADO.
 * Does not invent aliquota, CFOP, NCM, certificado or tipo legal NF-e/NFS-e.
 */

export const FISCAL_CREDENTIALING_STATUSES = {
  NotCredentialed: 'NOT_CREDENTIALED',
  Approved: 'APPROVED',
} as const;

export type FiscalCredentialingStatus =
  (typeof FISCAL_CREDENTIALING_STATUSES)[keyof typeof FISCAL_CREDENTIALING_STATUSES];

export const FISCAL_VALIDITY_LEGENDS = {
  NoFiscalValidity: 'SEM VALIDADE FISCAL',
  Homologation: 'AMBIENTE DE HOMOLOGAÇÃO - SEM VALOR FISCAL',
} as const;

export const OFFICIAL_DANFE = {
  Blocked: 'BLOCKED',
  Allowed: 'ALLOWED',
} as const;

export type FiscalCredentialingSnapshot = {
  status: FiscalCredentialingStatus;
  approved: boolean;
  source: string;
};

export const SRC006_FISCAL_CREDENTIALING: FiscalCredentialingSnapshot = {
  status: FISCAL_CREDENTIALING_STATUSES.NotCredentialed,
  approved: false,
  source: 'SRC-006',
};

export function assertFiscalTransmissionAllowed(snapshot: { approved: boolean }): void {
  if (!snapshot.approved) {
    throw new FiscalError('FISCAL_TRANSMISSION_BLOCKED');
  }
}

export function assertOfficialAuthorizationAllowed(input: {
  approved: boolean;
  protocolCode?: string | null;
}): void {
  assertFiscalTransmissionAllowed(input);
  if (!input.protocolCode?.trim()) {
    throw new FiscalError('FISCAL_OFFICIAL_AUTHORIZATION_BLOCKED');
  }
}

export function fiscalOfficialPresentation(input: {
  status: string;
  protocolCode?: string | null;
  credentialingApproved: boolean;
  environment?: 'DRAFT' | 'HOMOLOGATION' | 'PRODUCTION';
}): {
  validityLegend: string;
  officialDanfe: (typeof OFFICIAL_DANFE)[keyof typeof OFFICIAL_DANFE];
} {
  const environment = input.environment ?? 'PRODUCTION';
  if (environment === 'HOMOLOGATION') {
    return {
      validityLegend: FISCAL_VALIDITY_LEGENDS.Homologation,
      officialDanfe: OFFICIAL_DANFE.Blocked,
    };
  }
  const officiallyAuthorized =
    environment === 'PRODUCTION' &&
    input.status === 'AUTHORIZED' &&
    input.credentialingApproved &&
    Boolean(input.protocolCode?.trim());
  if (officiallyAuthorized) {
    return {
      validityLegend: '',
      officialDanfe: OFFICIAL_DANFE.Allowed,
    };
  }
  return {
    validityLegend: FISCAL_VALIDITY_LEGENDS.NoFiscalValidity,
    officialDanfe: OFFICIAL_DANFE.Blocked,
  };
}
