import { describe, expect, it } from 'vitest';
import {
  BudgetError,
  assertBudgetHasApprovingContent,
  assertBudgetLineHasDimension,
  assertBudgetPeriodsDoNotOverlap,
  assertBudgetVersionCanApprove,
  assertBudgetVersionEditable,
  compareBudgetLine,
  summarizeBudgetComparison,
} from './budget';

describe('budget domain', () => {
  it('keeps approved versions immutable and requires draft content to approve', () => {
    expect(() => assertBudgetVersionEditable('DRAFT')).not.toThrow();
    expect(() => assertBudgetVersionEditable('APPROVED')).toThrow(BudgetError);
    expect(() => assertBudgetVersionCanApprove('APPROVED')).toThrow(BudgetError);
    expect(() => assertBudgetHasApprovingContent(0, 1)).toThrow(BudgetError);
    expect(() => assertBudgetHasApprovingContent(1, 1)).not.toThrow();
  });

  it('rejects overlapping periods and lines without a planning dimension', () => {
    expect(() =>
      assertBudgetPeriodsDoNotOverlap([
        { startsOn: '2026-09-01', endsOn: '2026-09-30' },
        { startsOn: '2026-09-15', endsOn: '2026-10-15' },
      ]),
    ).toThrow(BudgetError);
    expect(() =>
      assertBudgetPeriodsDoNotOverlap([
        { startsOn: '2026-09-01', endsOn: '2026-09-30' },
        { startsOn: '2026-10-01', endsOn: '2026-10-31' },
      ]),
    ).not.toThrow();
    expect(() => assertBudgetLineHasDimension({})).toThrow(BudgetError);
    expect(() => assertBudgetLineHasDimension({ accountId: 'acc' })).not.toThrow();
  });

  it('computes budgeted, actual and variance on the backend', () => {
    const line = compareBudgetLine({
      lineId: 'line-1',
      periodKey: '2026-09',
      budgeted: '1000.0000',
      actual: '1250.0000',
      actualSource: 'POSTED_JOURNAL',
    });
    expect(line.variance).toBe('250.0000');
    const summary = summarizeBudgetComparison([
      line,
      compareBudgetLine({
        lineId: 'line-2',
        periodKey: '2026-09',
        budgeted: '500.0000',
        actual: '0.0000',
        actualSource: 'NONE',
      }),
    ]);
    expect(summary.budgeted).toBe('1500.0000');
    expect(summary.actual).toBe('1250.0000');
    expect(summary.variance).toBe('-250.0000');
  });
});
