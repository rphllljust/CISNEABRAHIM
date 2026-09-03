import { describe, expect, it } from 'vitest';
import {
  assertBalancedEntry,
  assertDraftMutable,
  assertPeriodOpen,
  creditTotal,
  debitTotal,
  isBalanced,
  JOURNAL_DIRECTIONS,
  JOURNAL_STATUSES,
  PERIOD_STATUSES,
  reconstructLedger,
  reversalLines,
} from './ledger';
import { validateDraftJournalInput } from './ledger.validation';

const debit = (accountId: string, amount: string, lineNumber: number) => ({
  lineNumber,
  accountId,
  direction: JOURNAL_DIRECTIONS.Debit,
  amount,
});

const credit = (accountId: string, amount: string, lineNumber: number) => ({
  lineNumber,
  accountId,
  direction: JOURNAL_DIRECTIONS.Credit,
  amount,
});

describe('accounting ledger domain', () => {
  const cash = '11111111-1111-4111-8111-111111111111';
  const revenue = '22222222-2222-4222-8222-222222222222';

  it('accepts a balanced two-line entry', () => {
    const lines = [debit(cash, '100.0000', 1), credit(revenue, '100.0000', 2)];
    expect(() => assertBalancedEntry(lines)).not.toThrow();
    expect(debitTotal(lines)).toBe('100');
    expect(creditTotal(lines)).toBe('100');
    expect(isBalanced(lines)).toBe(true);
  });

  it('rejects an unbalanced entry', () => {
    expect(() =>
      assertBalancedEntry([debit(cash, '100.0000', 1), credit(revenue, '90.0000', 2)]),
    ).toThrowError('ACCOUNTING_UNBALANCED_ENTRY');
    expect(
      isBalanced([debit(cash, '100.0000', 1), credit(revenue, '90.0000', 2)]),
    ).toBe(false);
  });

  it('rejects posting mutation of a posted entry and posting into a closed period', () => {
    expect(() => assertDraftMutable(JOURNAL_STATUSES.Posted)).toThrowError(
      'ACCOUNTING_ENTRY_IMMUTABLE',
    );
    expect(() => assertPeriodOpen(PERIOD_STATUSES.Closed)).toThrowError(
      'ACCOUNTING_PERIOD_CLOSED',
    );
  });

  it('builds reversal lines by swapping debit and credit without changing amounts', () => {
    const reversed = reversalLines([
      debit(cash, '40.0000', 1),
      credit(revenue, '40.0000', 2),
    ]);
    expect(reversed[0]?.direction).toBe(JOURNAL_DIRECTIONS.Credit);
    expect(reversed[1]?.direction).toBe(JOURNAL_DIRECTIONS.Debit);
    expect(reversed[0]?.amount).toBe('40.0000');
    expect(isBalanced(reversed)).toBe(true);
  });

  it('reconstructs a balanced ledger from posted lines', () => {
    const reconstruction = reconstructLedger([
      debit(cash, '100.0000', 1),
      credit(revenue, '100.0000', 2),
      { lineNumber: 1, accountId: cash, direction: JOURNAL_DIRECTIONS.Credit, amount: '25.0000' },
      { lineNumber: 2, accountId: revenue, direction: JOURNAL_DIRECTIONS.Debit, amount: '25.0000' },
    ]);
    expect(reconstruction.balanced).toBe(true);
    expect(reconstruction.totalDebits).toBe('125');
    expect(reconstruction.totalCredits).toBe('125');
    expect(reconstruction.byAccount[cash]?.debits).toBe('100');
    expect(reconstruction.byAccount[cash]?.credits).toBe('25');
  });

  it('rejects unbalanced draft payload before persistence', () => {
    expect(() =>
      validateDraftJournalInput({
        chartId: '33333333-3333-4333-8333-333333333333',
        periodId: '44444444-4444-4444-8444-444444444444',
        description: 'Venda',
        occurredOn: '2026-09-01',
        currencyCode: 'BRL',
        sourceKind: 'BILLING',
        sourceId: '55555555-5555-4555-8555-555555555555',
        sourceReference: 'BIL-1',
        idempotencyKey: 'k1',
        lines: [debit(cash, '10.0000', 1), credit(revenue, '9.0000', 2)],
      }),
    ).toThrowError('ACCOUNTING_UNBALANCED_ENTRY');
  });
});
