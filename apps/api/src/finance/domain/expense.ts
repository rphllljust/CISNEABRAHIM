import { moneyAmountsEqual, normalizeMoneyAmount, sumMoneyAmounts } from '../../platform/kernel/money-math';

export const EXPENSE_STATUSES = {
  Draft: 'DRAFT',
  Submitted: 'SUBMITTED',
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
} as const;

export type ExpenseStatus = (typeof EXPENSE_STATUSES)[keyof typeof EXPENSE_STATUSES];

export const EXPENSE_APPROVAL_DECISIONS = {
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
} as const;

export class ExpenseError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export function assertExpenseCanSubmit(status: string): void {
  if (status !== EXPENSE_STATUSES.Draft) {
    throw new ExpenseError('EXPENSE_INVALID_STATE');
  }
}

export function assertExpenseCanDecide(status: string): void {
  if (status !== EXPENSE_STATUSES.Submitted) {
    throw new ExpenseError('EXPENSE_INVALID_STATE');
  }
}

export function assertExpenseReceiptPresent(receiptDocumentId: string | null | undefined): void {
  if (!receiptDocumentId) {
    throw new ExpenseError('EXPENSE_RECEIPT_REQUIRED');
  }
}

export function assertExpenseNotSelfApproval(actorIdentityId: string, requesterIdentityId: string): void {
  if (actorIdentityId === requesterIdentityId) {
    throw new ExpenseError('EXPENSE_SELF_APPROVAL');
  }
}

export function assertExpenseItemTotal(items: Array<{ amount: string }>, totalAmount: string): void {
  const summed = sumMoneyAmounts(items.map((item) => normalizeMoneyAmount(item.amount)));
  if (!moneyAmountsEqual(summed, normalizeMoneyAmount(totalAmount))) {
    throw new ExpenseError('EXPENSE_ITEM_TOTAL_MISMATCH');
  }
}

export function computeExpenseTotal(items: Array<{ amount: string }>): string {
  return sumMoneyAmounts(items.map((item) => normalizeMoneyAmount(item.amount)));
}
