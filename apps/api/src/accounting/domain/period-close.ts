import { AccountingError } from './ledger';

export const PERIOD_CLOSE_CHECK_KINDS = {
  Receivables: 'RECEIVABLES',
  Payables: 'PAYABLES',
  Treasury: 'TREASURY',
  BankReconciliation: 'BANK_RECONCILIATION',
  Fiscal: 'FISCAL',
  Accounting: 'ACCOUNTING',
  DebitCredit: 'DEBIT_CREDIT',
  PendingPosting: 'PENDING_POSTING',
  DuplicateEconomicEvent: 'DUPLICATE_ECONOMIC_EVENT',
  OriginConsistency: 'ORIGIN_CONSISTENCY',
} as const;

export const PERIOD_CLOSE_CHECK_RESULTS = {
  Pass: 'PASS',
  Fail: 'FAIL',
  Informational: 'INFORMATIONAL',
} as const;

export const PERIOD_CLOSE_RUN_STATUSES = {
  Succeeded: 'SUCCEEDED',
  Blocked: 'BLOCKED',
} as const;

export type PeriodClosePolicy = {
  requireTrialBalanceBalanced: boolean;
  requireNoDraftJournals: boolean;
  requireNoCriticalPendingPostings: boolean;
  requireNoDuplicateEconomicEvents: boolean;
  requireOriginConsistency: boolean;
  requireBankReconciliationIntegrity: boolean;
  requireReceivablesSettled: boolean;
  requirePayablesSettled: boolean;
  requireAllBankLinesMatched: boolean;
  requireFiscalDocumentsAuthorized: boolean;
};

export const DEFAULT_PERIOD_CLOSE_POLICY: PeriodClosePolicy = {
  requireTrialBalanceBalanced: true,
  requireNoDraftJournals: true,
  requireNoCriticalPendingPostings: true,
  requireNoDuplicateEconomicEvents: true,
  requireOriginConsistency: true,
  requireBankReconciliationIntegrity: true,
  requireReceivablesSettled: false,
  requirePayablesSettled: false,
  requireAllBankLinesMatched: false,
  requireFiscalDocumentsAuthorized: false,
};

export type PeriodCloseObservations = {
  receivablesPending: number;
  payablesPending: number;
  treasuryMovements: number;
  bankIntegrityBroken: number;
  bankUnmatchedLines: number;
  fiscalUnauthorized: number;
  draftJournals: number;
  trialUnbalanced: number;
  pendingPostings: number;
  duplicateEconomicEvents: number;
  originInconsistencies: number;
};

export type PeriodCloseCheck = {
  kind: string;
  result: string;
  blocking: boolean;
  observedCount: number;
  detail: string;
};

export function evaluatePeriodCloseChecks(
  policy: PeriodClosePolicy,
  observations: PeriodCloseObservations,
): PeriodCloseCheck[] {
  return [
    classified(
      PERIOD_CLOSE_CHECK_KINDS.Receivables,
      observations.receivablesPending,
      policy.requireReceivablesSettled,
      'Pending receivables in the unit/period window.',
    ),
    classified(
      PERIOD_CLOSE_CHECK_KINDS.Payables,
      observations.payablesPending,
      policy.requirePayablesSettled,
      'Pending payables in the unit/period window.',
    ),
    classified(
      PERIOD_CLOSE_CHECK_KINDS.Treasury,
      observations.treasuryMovements,
      false,
      'Posted treasury movements observed; settlement is not required.',
    ),
    dual(
      PERIOD_CLOSE_CHECK_KINDS.BankReconciliation,
      observations.bankIntegrityBroken,
      policy.requireBankReconciliationIntegrity,
      'Broken confirmed bank reconciliations.',
      observations.bankUnmatchedLines,
      policy.requireAllBankLinesMatched,
      'Unmatched bank statement lines.',
    ),
    classified(
      PERIOD_CLOSE_CHECK_KINDS.Fiscal,
      observations.fiscalUnauthorized,
      policy.requireFiscalDocumentsAuthorized,
      'Fiscal documents in the period that are not authorized or cancelled.',
    ),
    classified(
      PERIOD_CLOSE_CHECK_KINDS.Accounting,
      observations.draftJournals,
      policy.requireNoDraftJournals,
      'Draft journals remain in the period.',
    ),
    classified(
      PERIOD_CLOSE_CHECK_KINDS.DebitCredit,
      observations.trialUnbalanced,
      policy.requireTrialBalanceBalanced,
      'Posted period debits do not equal credits.',
    ),
    classified(
      PERIOD_CLOSE_CHECK_KINDS.PendingPosting,
      observations.pendingPostings,
      policy.requireNoCriticalPendingPostings,
      'Critical pending posting requests remain for the period.',
    ),
    classified(
      PERIOD_CLOSE_CHECK_KINDS.DuplicateEconomicEvent,
      observations.duplicateEconomicEvents,
      policy.requireNoDuplicateEconomicEvents,
      'Duplicate posted economic events (same source kind and source id).',
    ),
    classified(
      PERIOD_CLOSE_CHECK_KINDS.OriginConsistency,
      observations.originInconsistencies,
      policy.requireOriginConsistency,
      'Posted journals whose origin cannot be found in the published read model.',
    ),
  ];
}

export function assertPeriodCloseAllowed(checks: PeriodCloseCheck[]): void {
  const blocking = checks.filter(
    (check) => check.blocking && check.result === PERIOD_CLOSE_CHECK_RESULTS.Fail,
  );
  if (blocking.some((check) => check.kind === PERIOD_CLOSE_CHECK_KINDS.Accounting)) {
    throw new AccountingError('ACCOUNTING_PERIOD_HAS_DRAFTS');
  }
  if (blocking.some((check) => check.kind === PERIOD_CLOSE_CHECK_KINDS.DebitCredit)) {
    throw new AccountingError('ACCOUNTING_UNBALANCED_TRIAL_BALANCE');
  }
  if (blocking.length > 0) {
    throw new AccountingError('ACCOUNTING_PERIOD_CLOSE_BLOCKED');
  }
}

export function periodCloseRunStatus(checks: PeriodCloseCheck[]): string {
  return checks.some((check) => check.blocking && check.result === PERIOD_CLOSE_CHECK_RESULTS.Fail)
    ? PERIOD_CLOSE_RUN_STATUSES.Blocked
    : PERIOD_CLOSE_RUN_STATUSES.Succeeded;
}

function classified(
  kind: string,
  observedCount: number,
  required: boolean,
  detail: string,
): PeriodCloseCheck {
  if (observedCount > 0 && required) {
    return {
      kind,
      result: PERIOD_CLOSE_CHECK_RESULTS.Fail,
      blocking: true,
      observedCount,
      detail,
    };
  }
  if (observedCount > 0) {
    return {
      kind,
      result: PERIOD_CLOSE_CHECK_RESULTS.Informational,
      blocking: false,
      observedCount,
      detail,
    };
  }
  return {
    kind,
    result: PERIOD_CLOSE_CHECK_RESULTS.Pass,
    blocking: required,
    observedCount: 0,
    detail,
  };
}

function dual(
  kind: string,
  integrityBroken: number,
  requireIntegrity: boolean,
  integrityDetail: string,
  unmatched: number,
  requireMatched: boolean,
  unmatchedDetail: string,
): PeriodCloseCheck {
  if (integrityBroken > 0 && requireIntegrity) {
    return {
      kind,
      result: PERIOD_CLOSE_CHECK_RESULTS.Fail,
      blocking: true,
      observedCount: integrityBroken,
      detail: integrityDetail,
    };
  }
  if (unmatched > 0 && requireMatched) {
    return {
      kind,
      result: PERIOD_CLOSE_CHECK_RESULTS.Fail,
      blocking: true,
      observedCount: unmatched,
      detail: unmatchedDetail,
    };
  }
  const observed = integrityBroken + unmatched;
  if (observed > 0) {
    return {
      kind,
      result: PERIOD_CLOSE_CHECK_RESULTS.Informational,
      blocking: false,
      observedCount: observed,
      detail: integrityBroken > 0 ? integrityDetail : unmatchedDetail,
    };
  }
  return {
    kind,
    result: PERIOD_CLOSE_CHECK_RESULTS.Pass,
    blocking: requireIntegrity || requireMatched,
    observedCount: 0,
    detail: integrityDetail,
  };
}
