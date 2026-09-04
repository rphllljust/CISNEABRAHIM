export const PAYROLL_ENGINE_ERROR_CODES = {
  PAYROLL_RULE_NOT_CONFIGURED: 'PAYROLL_RULE_NOT_CONFIGURED',
  DUPLICATE_RULE_VERSION: 'PAYROLL_DUPLICATE_RULE_VERSION',
  INVALID_RULE_VERSION: 'PAYROLL_INVALID_RULE_VERSION',
  PERIOD_CLOSED: 'PAYROLL_PERIOD_CLOSED',
  INVALID_CONFIG: 'PAYROLL_INVALID_CONFIG',
} as const;

export type PayrollEngineErrorCode =
  (typeof PAYROLL_ENGINE_ERROR_CODES)[keyof typeof PAYROLL_ENGINE_ERROR_CODES];

export class PayrollEngineError extends Error {
  constructor(
    readonly code: PayrollEngineErrorCode,
    readonly detail?: string,
  ) {
    super(code);
    this.name = 'PayrollEngineError';
  }
}
