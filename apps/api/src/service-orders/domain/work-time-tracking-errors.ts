export const WORK_TIME_ERROR_CODES = {
  OVERLAPPING_WORKLOG: 'WORKTIME_OVERLAPPING_WORKLOG',
  DUPLICATE_WORKLOG: 'WORKTIME_DUPLICATE_WORKLOG',
  INVALID_WORKLOG: 'WORKTIME_INVALID_WORKLOG',
  WORKLOG_IMMUTABLE: 'WORKTIME_IMMUTABLE',
  SELF_APPROVAL: 'WORKTIME_SELF_APPROVAL',
  UNAUTHORIZED: 'WORKTIME_UNAUTHORIZED',
  PAYROLL_NOT_ALLOWED: 'WORKTIME_PAYROLL_NOT_ALLOWED',
} as const;

export type WorkTimeErrorCode =
  (typeof WORK_TIME_ERROR_CODES)[keyof typeof WORK_TIME_ERROR_CODES];

export class WorkTimeError extends Error {
  constructor(
    readonly code: WorkTimeErrorCode,
    readonly detail?: string,
  ) {
    super(code);
    this.name = 'WorkTimeError';
  }
}
