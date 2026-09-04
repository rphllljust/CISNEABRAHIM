export const ELIGIBILITY_ERROR_CODES = {
  UNKNOWN_RULE: 'ELIGIBILITY_UNKNOWN_RULE',
  INVALID_OVERRIDE: 'ELIGIBILITY_INVALID_OVERRIDE',
  OVERRIDE_NOT_AUTHORIZED: 'ELIGIBILITY_OVERRIDE_NOT_AUTHORIZED',
} as const;

export type EligibilityErrorCode =
  (typeof ELIGIBILITY_ERROR_CODES)[keyof typeof ELIGIBILITY_ERROR_CODES];

export class EligibilityError extends Error {
  constructor(
    readonly code: EligibilityErrorCode,
    readonly ruleId?: string,
  ) {
    super(code);
    this.name = 'EligibilityError';
  }
}
