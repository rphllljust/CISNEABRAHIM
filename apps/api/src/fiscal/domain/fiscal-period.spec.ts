import { describe, expect, it } from 'vitest';
import {
  FISCAL_PERIOD_CLOSE_CHECK_KINDS,
  FISCAL_PERIOD_STATUSES,
  FiscalPeriodError,
  assertFiscalPeriodAcceptsOrdinaryChange,
  assertFiscalPeriodCanClose,
  assertFiscalPeriodCanReopen,
  assertFiscalPeriodCloseAllowed,
  assertFiscalPeriodKey,
  evaluateFiscalPeriodCloseChecks,
  fiscalPeriodCloseRunStatus,
  fiscalPeriodKeyFromDate,
} from './fiscal-period';

describe('fiscal period domain', () => {
  it('derives competence keys from issued dates', () => {
    expect(fiscalPeriodKeyFromDate('2026-03-15')).toBe('2026-03');
    expect(assertFiscalPeriodKey('2026-03')).toBe('2026-03');
  });

  it('rejects ordinary writes on a closed period', () => {
    expect(() => assertFiscalPeriodAcceptsOrdinaryChange(FISCAL_PERIOD_STATUSES.Open)).not.toThrow();
    expect(() => assertFiscalPeriodAcceptsOrdinaryChange(null)).not.toThrow();
    expect(() => assertFiscalPeriodAcceptsOrdinaryChange(FISCAL_PERIOD_STATUSES.Closed)).toThrow(
      FiscalPeriodError,
    );
  });

  it('allows close of open and idempotent close of already closed', () => {
    expect(() => assertFiscalPeriodCanClose(FISCAL_PERIOD_STATUSES.Open)).not.toThrow();
    expect(() => assertFiscalPeriodCanClose(FISCAL_PERIOD_STATUSES.Closed)).not.toThrow();
  });

  it('reopens only a closed period', () => {
    expect(() => assertFiscalPeriodCanReopen(FISCAL_PERIOD_STATUSES.Closed)).not.toThrow();
    expect(() => assertFiscalPeriodCanReopen(FISCAL_PERIOD_STATUSES.Open)).toThrow(FiscalPeriodError);
  });

  it('blocks close when documents, assessments, adjustments or pendencies remain', () => {
    const blocked = evaluateFiscalPeriodCloseChecks({
      pendingDocuments: 1,
      draftAssessments: 0,
      incompleteAdjustments: 0,
      criticalPendencies: 0,
    });
    expect(blocked[0]?.kind).toBe(FISCAL_PERIOD_CLOSE_CHECK_KINDS.Documents);
    expect(() => assertFiscalPeriodCloseAllowed(blocked)).toThrow(FiscalPeriodError);
    expect(fiscalPeriodCloseRunStatus(blocked)).toBe('BLOCKED');

    const clean = evaluateFiscalPeriodCloseChecks({
      pendingDocuments: 0,
      draftAssessments: 0,
      incompleteAdjustments: 0,
      criticalPendencies: 0,
    });
    expect(() => assertFiscalPeriodCloseAllowed(clean)).not.toThrow();
    expect(fiscalPeriodCloseRunStatus(clean)).toBe('SUCCEEDED');
  });
});
