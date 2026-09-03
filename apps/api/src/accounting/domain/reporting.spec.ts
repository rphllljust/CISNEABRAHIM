import { describe, expect, it } from 'vitest';
import { ACCOUNT_CLASSES, JOURNAL_DIRECTIONS } from './ledger';
import {
  assertPeriodCloseable,
  balanceSheetFromTotals,
  combineDebitCredit,
  incomeStatementFromTotals,
  reportEquationHolds,
  totalsByAccount,
  trialBalanceFromTotals,
} from './reporting';

describe('accounting reporting domain', () => {
  const cash = {
    id: '11111111-1111-4111-8111-111111111111',
    code: '1.1',
    name: 'Cash',
    class: ACCOUNT_CLASSES.Asset,
  };
  const revenue = {
    id: '22222222-2222-4222-8222-222222222222',
    code: '4.1',
    name: 'Revenue',
    class: ACCOUNT_CLASSES.Revenue,
  };
  const expense = {
    id: '33333333-3333-4333-8333-333333333333',
    code: '5.1',
    name: 'Expense',
    class: ACCOUNT_CLASSES.Expense,
  };

  it('builds trial balance with zero debit/credit difference from posted totals', () => {
    const rows = totalsByAccount(
      [cash, revenue],
      [],
      [
        {
          accountId: cash.id,
          accountCode: cash.code,
          accountName: cash.name,
          accountClass: cash.class,
          direction: JOURNAL_DIRECTIONS.Debit,
          amount: '100.0000',
        },
        {
          accountId: revenue.id,
          accountCode: revenue.code,
          accountName: revenue.name,
          accountClass: revenue.class,
          direction: JOURNAL_DIRECTIONS.Credit,
          amount: '100.0000',
        },
      ],
    );
    const trial = trialBalanceFromTotals(rows);
    expect(trial.balanced).toBe(true);
    expect(trial.difference).toBe('0.0000');
    expect(trial.totalDebits).toBe('100');
    expect(trial.totalCredits).toBe('100');
  });

  it('carries opening balances into closing general ledger amounts', () => {
    const combined = combineDebitCredit(
      { debits: '40.0000', credits: '0.0000' },
      { debits: '10.0000', credits: '5.0000' },
    );
    expect(combined.closingDebits).toBe('50');
    expect(combined.closingCredits).toBe('5');
    expect(combined.trialDebit).toBe('45');
    expect(combined.trialCredit).toBe('0.0000');
  });

  it('rejects income statement when revenue or expense classification is missing', () => {
    expect(() => incomeStatementFromTotals([cash], [])).toThrowError(
      'REPORT_CLASSIFICATION_INCOMPLETE',
    );
    const rows = totalsByAccount(
      [cash, revenue, expense],
      [],
      [
        {
          accountId: cash.id,
          accountCode: cash.code,
          accountName: cash.name,
          accountClass: cash.class,
          direction: JOURNAL_DIRECTIONS.Debit,
          amount: '70.0000',
        },
        {
          accountId: revenue.id,
          accountCode: revenue.code,
          accountName: revenue.name,
          accountClass: revenue.class,
          direction: JOURNAL_DIRECTIONS.Credit,
          amount: '100.0000',
        },
        {
          accountId: expense.id,
          accountCode: expense.code,
          accountName: expense.name,
          accountClass: expense.class,
          direction: JOURNAL_DIRECTIONS.Debit,
          amount: '30.0000',
        },
      ],
    );
    const dre = incomeStatementFromTotals([cash, revenue, expense], rows);
    expect(dre.available).toBe(true);
    expect(dre.revenue).toBe('100');
    expect(dre.expense).toBe('30');
    expect(dre.netIncome).toBe('70');
  });

  it('keeps the classified balance sheet in equation with current net income', () => {
    const equity = {
      id: '44444444-4444-4444-8444-444444444444',
      code: '3.1',
      name: 'Equity',
      class: ACCOUNT_CLASSES.Equity,
    };
    const rows = totalsByAccount(
      [cash, equity, revenue],
      [],
      [
        {
          accountId: cash.id,
          accountCode: cash.code,
          accountName: cash.name,
          accountClass: cash.class,
          direction: JOURNAL_DIRECTIONS.Debit,
          amount: '100.0000',
        },
        {
          accountId: revenue.id,
          accountCode: revenue.code,
          accountName: revenue.name,
          accountClass: revenue.class,
          direction: JOURNAL_DIRECTIONS.Credit,
          amount: '80.0000',
        },
        {
          accountId: equity.id,
          accountCode: equity.code,
          accountName: equity.name,
          accountClass: equity.class,
          direction: JOURNAL_DIRECTIONS.Credit,
          amount: '20.0000',
        },
      ],
    );
    const dre = incomeStatementFromTotals([cash, equity, revenue], rows);
    const sheet = balanceSheetFromTotals([cash, equity, revenue], rows);
    expect(sheet.available).toBe(true);
    expect(sheet.assets).toBe('100');
    expect(sheet.equity).toBe('20');
    expect(sheet.netIncome).toBe('80');
    expect(sheet.netIncome).toBe(dre.netIncome);
    expect(sheet.balanced).toBe(true);
    expect(
      reportEquationHolds({
        assets: sheet.assets,
        liabilities: sheet.liabilities,
        equity: sheet.equity,
        netIncome: sheet.netIncome,
      }),
    ).toBe(true);
  });

  it('rejects reports when an account has no known classification', () => {
    const unknown = {
      id: '55555555-5555-4555-8555-555555555555',
      code: '9.9',
      name: 'Unclassified',
      class: '',
    };
    expect(() => incomeStatementFromTotals([cash, revenue, unknown], [])).toThrowError(
      'REPORT_CLASSIFICATION_INCOMPLETE',
    );
    expect(() => balanceSheetFromTotals([unknown], [])).toThrowError(
      'REPORT_CLASSIFICATION_INCOMPLETE',
    );
    expect(() => balanceSheetFromTotals([revenue], [])).toThrowError(
      'REPORT_CLASSIFICATION_INCOMPLETE',
    );
  });

  it('rejects period close when drafts remain or trial balance is unbalanced', () => {
    expect(() =>
      assertPeriodCloseable({
        draftCount: 1,
        trialBalance: { balanced: true, difference: '0.0000' },
      }),
    ).toThrowError('ACCOUNTING_PERIOD_HAS_DRAFTS');
    expect(() =>
      assertPeriodCloseable({
        draftCount: 0,
        trialBalance: { balanced: false, difference: '1.0000' },
      }),
    ).toThrowError('ACCOUNTING_UNBALANCED_TRIAL_BALANCE');
  });
});
