import { describe, expect, it } from 'vitest';
import {
  ExpenseError,
  assertExpenseCanDecide,
  assertExpenseCanSubmit,
  assertExpenseItemTotal,
  assertExpenseNotSelfApproval,
  assertExpenseReceiptPresent,
  computeExpenseTotal,
} from './expense';

describe('expense domain', () => {
  it('computes item totals and rejects a mismatch', () => {
    expect(computeExpenseTotal([{ amount: '10.5' }, { amount: '4.5' }])).toBe('15');
    expect(() => assertExpenseItemTotal([{ amount: '10' }], '11')).toThrow(ExpenseError);
  });

  it('forbids self-approval of the requester', () => {
    expect(() => assertExpenseNotSelfApproval('actor-1', 'actor-1')).toThrow(ExpenseError);
    expect(() => assertExpenseNotSelfApproval('approver', 'requester')).not.toThrow();
  });

  it('requires a receipt document before submit and only decides submitted expenses', () => {
    expect(() => assertExpenseReceiptPresent(null)).toThrow(ExpenseError);
    expect(() => assertExpenseCanSubmit('SUBMITTED')).toThrow(ExpenseError);
    expect(() => assertExpenseCanDecide('DRAFT')).toThrow(ExpenseError);
    expect(() => assertExpenseCanDecide('SUBMITTED')).not.toThrow();
  });
});
