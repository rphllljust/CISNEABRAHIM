import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PERIOD_CLOSE_POLICY,
  PERIOD_CLOSE_CHECK_KINDS,
  PERIOD_CLOSE_CHECK_RESULTS,
  PERIOD_CLOSE_RUN_STATUSES,
  assertPeriodCloseAllowed,
  evaluatePeriodCloseChecks,
  periodCloseRunStatus,
} from './period-close';

const clean = {
  receivablesPending: 0,
  payablesPending: 0,
  treasuryMovements: 2,
  bankIntegrityBroken: 0,
  bankUnmatchedLines: 0,
  fiscalUnauthorized: 0,
  draftJournals: 0,
  trialUnbalanced: 0,
  pendingPostings: 0,
  duplicateEconomicEvents: 0,
  originInconsistencies: 0,
};

describe('period close domain', () => {
  it('does not require receivables or payables to be settled by default', () => {
    expect(DEFAULT_PERIOD_CLOSE_POLICY.requireReceivablesSettled).toBe(false);
    expect(DEFAULT_PERIOD_CLOSE_POLICY.requirePayablesSettled).toBe(false);
    const checks = evaluatePeriodCloseChecks(DEFAULT_PERIOD_CLOSE_POLICY, {
      ...clean,
      receivablesPending: 3,
      payablesPending: 2,
      treasuryMovements: 4,
    });
    expect(periodCloseRunStatus(checks)).toBe(PERIOD_CLOSE_RUN_STATUSES.Succeeded);
    expect(
      checks.find((item) => item.kind === PERIOD_CLOSE_CHECK_KINDS.Receivables)?.result,
    ).toBe(PERIOD_CLOSE_CHECK_RESULTS.Informational);
    expect(() => assertPeriodCloseAllowed(checks)).not.toThrow();
  });

  it('blocks close only for configured reconciliation failures', () => {
    const blocked = evaluatePeriodCloseChecks(DEFAULT_PERIOD_CLOSE_POLICY, {
      ...clean,
      draftJournals: 1,
    });
    expect(periodCloseRunStatus(blocked)).toBe(PERIOD_CLOSE_RUN_STATUSES.Blocked);
    expect(() => assertPeriodCloseAllowed(blocked)).toThrowError('ACCOUNTING_PERIOD_HAS_DRAFTS');

    const unbalanced = evaluatePeriodCloseChecks(DEFAULT_PERIOD_CLOSE_POLICY, {
      ...clean,
      trialUnbalanced: 1,
    });
    expect(unbalanced.find((item) => item.kind === PERIOD_CLOSE_CHECK_KINDS.DebitCredit)?.blocking).toBe(
      true,
    );

    const settledRequired = evaluatePeriodCloseChecks(
      { ...DEFAULT_PERIOD_CLOSE_POLICY, requireReceivablesSettled: true },
      { ...clean, receivablesPending: 1 },
    );
    expect(periodCloseRunStatus(settledRequired)).toBe(PERIOD_CLOSE_RUN_STATUSES.Blocked);
  });
});
