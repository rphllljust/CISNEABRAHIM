export const PAYROLL_CLOSE_ERROR_CODES = {
  CRITICAL_PENDING: 'PAYROLL_CLOSE_CRITICAL_PENDING',
  INCONSISTENT: 'PAYROLL_CLOSE_INCONSISTENT',
  ALREADY_CLOSED: 'PAYROLL_CLOSE_ALREADY_CLOSED',
  REOPEN_UNAUTHORIZED: 'PAYROLL_CLOSE_REOPEN_UNAUTHORIZED',
  REOPEN_REASON_REQUIRED: 'PAYROLL_CLOSE_REOPEN_REASON_REQUIRED',
  IMMUTABLE: 'PAYROLL_CLOSE_IMMUTABLE',
} as const;

export type PayrollCloseErrorCode =
  (typeof PAYROLL_CLOSE_ERROR_CODES)[keyof typeof PAYROLL_CLOSE_ERROR_CODES];

export class PayrollCloseError extends Error {
  constructor(
    readonly code: PayrollCloseErrorCode,
    readonly detail?: string,
  ) {
    super(code);
    this.name = 'PayrollCloseError';
  }
}
