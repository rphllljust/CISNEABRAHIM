export const MDFE_READINESS_ERROR_CODES = {
  FAKE_PROVIDER_FORBIDDEN: 'MDFE_FAKE_PROVIDER_FORBIDDEN',
} as const;

export type MdfeReadinessErrorCode =
  (typeof MDFE_READINESS_ERROR_CODES)[keyof typeof MDFE_READINESS_ERROR_CODES];

export class MdfeReadinessError extends Error {
  constructor(readonly code: MdfeReadinessErrorCode) {
    super(code);
    this.name = 'MdfeReadinessError';
  }
}
