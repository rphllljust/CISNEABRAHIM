export const OWN_COMPANY_BOOTSTRAP_ERROR_CODES = {
  MISSING_REQUIRED: 'OWN_COMPANY_BOOTSTRAP_MISSING_REQUIRED',
  INVALID_CNPJ: 'OWN_COMPANY_BOOTSTRAP_INVALID_CNPJ',
} as const;

export type OwnCompanyBootstrapErrorCode =
  (typeof OWN_COMPANY_BOOTSTRAP_ERROR_CODES)[keyof typeof OWN_COMPANY_BOOTSTRAP_ERROR_CODES];

export class OwnCompanyBootstrapError extends Error {
  constructor(readonly code: OwnCompanyBootstrapErrorCode) {
    super(code);
    this.name = 'OwnCompanyBootstrapError';
  }
}
