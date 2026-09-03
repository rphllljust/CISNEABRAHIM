export const FISCAL_PERIOD_STATUSES = {
  Open: 'OPEN',
  Closed: 'CLOSED',
} as const;

export type FiscalPeriodStatus = (typeof FISCAL_PERIOD_STATUSES)[keyof typeof FISCAL_PERIOD_STATUSES];

export const FISCAL_PERIOD_CLOSE_CHECK_KINDS = {
  Documents: 'DOCUMENTS',
  Assessments: 'ASSESSMENTS',
  Adjustments: 'ADJUSTMENTS',
  CriticalPendencies: 'CRITICAL_PENDENCIES',
} as const;

export const FISCAL_PERIOD_CLOSE_RESULTS = {
  Pass: 'PASS',
  Fail: 'FAIL',
} as const;

export const FISCAL_PERIOD_CLOSE_RUN_STATUSES = {
  Succeeded: 'SUCCEEDED',
  Blocked: 'BLOCKED',
} as const;

export class FiscalPeriodError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

const PERIOD_KEY_PATTERN = /^\d{4}-\d{2}$/;

export function fiscalPeriodKeyFromDate(value: string): string {
  const day = value.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new FiscalPeriodError('FISCAL_PERIOD_INVALID');
  }
  return day.slice(0, 7);
}

export function assertFiscalPeriodKey(periodKey: string): string {
  const trimmed = periodKey.trim();
  if (!PERIOD_KEY_PATTERN.test(trimmed)) {
    throw new FiscalPeriodError('FISCAL_PERIOD_INVALID');
  }
  return trimmed;
}

export function assertFiscalPeriodAcceptsOrdinaryChange(status: string | null | undefined): void {
  if (status === FISCAL_PERIOD_STATUSES.Closed) {
    throw new FiscalPeriodError('FISCAL_PERIOD_CLOSED');
  }
}

export function assertFiscalPeriodCanClose(status: string): void {
  if (status === FISCAL_PERIOD_STATUSES.Closed) {
    return;
  }
  if (status !== FISCAL_PERIOD_STATUSES.Open) {
    throw new FiscalPeriodError('FISCAL_PERIOD_INVALID');
  }
}

export function assertFiscalPeriodCanReopen(status: string): void {
  if (status !== FISCAL_PERIOD_STATUSES.Closed) {
    throw new FiscalPeriodError('FISCAL_PERIOD_NOT_CLOSED');
  }
}

export type FiscalPeriodCloseObservations = {
  pendingDocuments: number;
  draftAssessments: number;
  incompleteAdjustments: number;
  criticalPendencies: number;
};

export type FiscalPeriodCloseCheck = {
  kind: string;
  result: string;
  blocking: boolean;
  observedCount: number;
  detail: string;
};

export function evaluateFiscalPeriodCloseChecks(
  observations: FiscalPeriodCloseObservations,
): FiscalPeriodCloseCheck[] {
  return [
    check(
      FISCAL_PERIOD_CLOSE_CHECK_KINDS.Documents,
      observations.pendingDocuments,
      'Fiscal documents in the period are not authorized or cancelled.',
    ),
    check(
      FISCAL_PERIOD_CLOSE_CHECK_KINDS.Assessments,
      observations.draftAssessments,
      'Draft tax assessments remain in the period.',
    ),
    check(
      FISCAL_PERIOD_CLOSE_CHECK_KINDS.Adjustments,
      observations.incompleteAdjustments,
      'Incomplete formal adjustments remain in the period.',
    ),
    check(
      FISCAL_PERIOD_CLOSE_CHECK_KINDS.CriticalPendencies,
      observations.criticalPendencies,
      'Critical fiscal pendencies remain (in-flight documents or obligations without payable).',
    ),
  ];
}

export function assertFiscalPeriodCloseAllowed(checks: FiscalPeriodCloseCheck[]): void {
  if (checks.some((item) => item.blocking && item.result === FISCAL_PERIOD_CLOSE_RESULTS.Fail)) {
    throw new FiscalPeriodError('FISCAL_PERIOD_CLOSE_BLOCKED');
  }
}

export function fiscalPeriodCloseRunStatus(checks: FiscalPeriodCloseCheck[]): string {
  return checks.some((item) => item.blocking && item.result === FISCAL_PERIOD_CLOSE_RESULTS.Fail)
    ? FISCAL_PERIOD_CLOSE_RUN_STATUSES.Blocked
    : FISCAL_PERIOD_CLOSE_RUN_STATUSES.Succeeded;
}

function check(kind: string, observedCount: number, detail: string): FiscalPeriodCloseCheck {
  if (observedCount > 0) {
    return {
      kind,
      result: FISCAL_PERIOD_CLOSE_RESULTS.Fail,
      blocking: true,
      observedCount,
      detail,
    };
  }
  return {
    kind,
    result: FISCAL_PERIOD_CLOSE_RESULTS.Pass,
    blocking: true,
    observedCount: 0,
    detail,
  };
}
