import { describe, expect, it } from 'vitest';
import {
  FINANCIAL_ACCOUNT_LIFECYCLES,
  FINANCIAL_DIRECTIONS,
  FINANCIAL_TRANSACTION_STATUSES,
  assertAccountActive,
  assertSufficientBalance,
  assertTransactionImmutable,
  assertTransferLegs,
  derivedBalance,
  reconcileAccount,
  transferNetZero,
} from './treasury';
import { validateTransferTreasuryInput } from './treasury.validation';

describe('treasury domain', () => {
  const credit = (amount: string) => ({
    direction: FINANCIAL_DIRECTIONS.Credit,
    amount,
    status: FINANCIAL_TRANSACTION_STATUSES.Posted,
  });
  const debit = (amount: string) => ({
    direction: FINANCIAL_DIRECTIONS.Debit,
    amount,
    status: FINANCIAL_TRANSACTION_STATUSES.Posted,
  });

  it('derives balance from posted credits minus debits without a stored saldo', () => {
    expect(derivedBalance([credit('100.0000'), debit('40.0000')])).toBe('60');
    expect(derivedBalance([])).toBe('0');
  });

  it('rejects debit that would go negative when overdraft is not allowed', () => {
    expect(() =>
      assertSufficientBalance({
        currentBalance: '50.0000',
        debitAmount: '50.0001',
        overdraftAllowed: false,
      }),
    ).toThrowError('TREASURY_INSUFFICIENT_BALANCE');
    expect(() =>
      assertSufficientBalance({
        currentBalance: '50.0000',
        debitAmount: '80.0000',
        overdraftAllowed: true,
      }),
    ).not.toThrow();
  });

  it('requires transfer legs to debit source and credit destination for the same amount', () => {
    expect(() =>
      assertTransferLegs({
        fromAccountId: 'a',
        toAccountId: 'b',
        debit: { accountId: 'a', direction: FINANCIAL_DIRECTIONS.Debit, amount: '10.0000' },
        credit: { accountId: 'b', direction: FINANCIAL_DIRECTIONS.Credit, amount: '10.0000' },
      }),
    ).not.toThrow();
    expect(() =>
      assertTransferLegs({
        fromAccountId: 'a',
        toAccountId: 'b',
        debit: { accountId: 'a', direction: FINANCIAL_DIRECTIONS.Debit, amount: '10.0000' },
        credit: { accountId: 'b', direction: FINANCIAL_DIRECTIONS.Credit, amount: '9.0000' },
      }),
    ).toThrowError('TREASURY_UNBALANCED_TRANSFER');
    expect(
      transferNetZero([
        debit('25.0000'),
        credit('25.0000'),
      ]),
    ).toBe(true);
  });

  it('rejects transfer to the same account', () => {
    expect(() =>
      validateTransferTreasuryInput({
        fromAccountId: '11111111-1111-4111-8111-111111111111',
        toAccountId: '11111111-1111-4111-8111-111111111111',
        amount: '10.0000',
        rowVersionFrom: 1,
        rowVersionTo: 1,
        idempotencyKey: 'k',
        reference: 'TED',
        originId: '22222222-2222-4222-8222-222222222222',
        originReference: 'TED',
      }),
    ).toThrowError('TREASURY_SAME_ACCOUNT_TRANSFER');
  });

  it('blocks silent edit of a confirmed movement', () => {
    expect(() => assertTransactionImmutable()).toThrowError('TREASURY_TRANSACTION_IMMUTABLE');
    expect(() => assertAccountActive(FINANCIAL_ACCOUNT_LIFECYCLES.Closed)).toThrowError(
      'TREASURY_ACCOUNT_CLOSED',
    );
  });

  it('reconciles credits minus debits to derived balance', () => {
    const result = reconcileAccount({
      movements: [credit('250.0000'), debit('100.0000'), debit('150.0000')],
    });
    expect(result.balance).toBe('0');
    expect(result.credits).toBe('250');
    expect(result.debits).toBe('250');
  });
});
