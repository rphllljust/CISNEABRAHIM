import { describe, expect, it } from 'vitest';
import { ACCOUNT_CLASSES, AccountingError, JOURNAL_DIRECTIONS } from './ledger';
import {
  accountMayReceivePostings,
  assertAccountPostable,
  assertKnownAccountClass,
  CLASS_NORMAL_BALANCE,
  normalBalanceForClass,
} from './accounting-semantics';

describe('accounting semantics (natureza centralizada)', () => {
  it('centralizes normal balance by account class', () => {
    expect(CLASS_NORMAL_BALANCE).toEqual({
      [ACCOUNT_CLASSES.Asset]: JOURNAL_DIRECTIONS.Debit,
      [ACCOUNT_CLASSES.Expense]: JOURNAL_DIRECTIONS.Debit,
      [ACCOUNT_CLASSES.Liability]: JOURNAL_DIRECTIONS.Credit,
      [ACCOUNT_CLASSES.Equity]: JOURNAL_DIRECTIONS.Credit,
      [ACCOUNT_CLASSES.Revenue]: JOURNAL_DIRECTIONS.Credit,
    });
  });

  it('derives DEBIT normal balance for asset and expense', () => {
    expect(normalBalanceForClass(ACCOUNT_CLASSES.Asset)).toBe('DEBIT');
    expect(normalBalanceForClass(ACCOUNT_CLASSES.Expense)).toBe('DEBIT');
  });

  it('derives CREDIT normal balance for liability, equity and revenue', () => {
    expect(normalBalanceForClass(ACCOUNT_CLASSES.Liability)).toBe('CREDIT');
    expect(normalBalanceForClass(ACCOUNT_CLASSES.Equity)).toBe('CREDIT');
    expect(normalBalanceForClass(ACCOUNT_CLASSES.Revenue)).toBe('CREDIT');
  });

  it('rejects unknown class instead of guessing normal balance', () => {
    expect(() => normalBalanceForClass('MEMO')).toThrow(AccountingError);
    expect(() => assertKnownAccountClass('')).toThrow(AccountingError);
  });

  it('allows postings only on active analytical (leaf) accounts', () => {
    expect(accountMayReceivePostings({ status: 'ACTIVE', hasChildren: false })).toBe(true);
    expect(accountMayReceivePostings({ status: 'ACTIVE', hasChildren: true })).toBe(false);
    expect(accountMayReceivePostings({ status: 'INACTIVE', hasChildren: false })).toBe(false);
    expect(accountMayReceivePostings({ status: 'INACTIVE', hasChildren: true })).toBe(false);
  });

  it('throws the semantic error codes for inactive and synthetic accounts', () => {
    expect(() => assertAccountPostable({ status: 'INACTIVE', hasChildren: false })).toThrow(
      'ACCOUNTING_ACCOUNT_INACTIVE',
    );
    expect(() => assertAccountPostable({ status: 'ACTIVE', hasChildren: true })).toThrow(
      'ACCOUNTING_ACCOUNT_SYNTHETIC',
    );
    expect(() => assertAccountPostable({ status: 'ACTIVE', hasChildren: false })).not.toThrow();
  });
});
