import { assertCurrencyCode, isPositiveMoneyAmount, normalizeMoneyAmount } from '../../platform/kernel/money-math';
import { assertUuid } from '../../platform/kernel/uuid';
import { ExpenseError, computeExpenseTotal } from './expense';

export type CreateExpenseInput = {
  unitId: string;
  expenseCategoryId: string;
  costCenterId: string;
  costCenterCode: string;
  currencyCode?: string;
  dueDate: string;
  paymentTerms: string;
  description: string;
  receiptDocumentId?: string | null;
  reimbursable?: boolean;
  items: Array<{ description: string; amount: string }>;
  idempotencyKey: string;
};

export type ExpenseVersionInput = {
  version: number;
};

export type RejectExpenseInput = {
  version: number;
  reason: string;
};

function requireText(value: string | undefined, code = 'EXPENSE_INVALID'): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    throw new ExpenseError(code);
  }
  return trimmed;
}

function requireVersion(version: number): number {
  if (!Number.isInteger(version) || version < 1) {
    throw new ExpenseError('EXPENSE_VERSION_CONFLICT');
  }
  return version;
}

function requireDueDate(value: string): string {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new ExpenseError('EXPENSE_INVALID');
  }
  return trimmed;
}

export function validateCreateExpenseInput(input: CreateExpenseInput): {
  unitId: string;
  expenseCategoryId: string;
  costCenterId: string;
  costCenterCode: string;
  currencyCode: string;
  dueDate: string;
  paymentTerms: string;
  description: string;
  receiptDocumentId: string | null;
  reimbursable: boolean;
  items: Array<{ description: string; amount: string }>;
  totalAmount: string;
  idempotencyKey: string;
} {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new ExpenseError('EXPENSE_INVALID');
  }
  const items = input.items.map((item) => {
    const amount = normalizeMoneyAmount(item.amount);
    if (!isPositiveMoneyAmount(amount)) {
      throw new ExpenseError('EXPENSE_INVALID');
    }
    return {
      description: requireText(item.description),
      amount,
    };
  });
  const receiptDocumentId = input.receiptDocumentId?.trim() || null;
  if (receiptDocumentId) {
    assertUuid(receiptDocumentId, 'receiptDocumentId');
  }
  assertUuid(input.expenseCategoryId, 'expenseCategoryId');
  assertUuid(input.costCenterId, 'costCenterId');
  return {
    unitId: requireText(input.unitId),
    expenseCategoryId: input.expenseCategoryId,
    costCenterId: input.costCenterId,
    costCenterCode: requireText(input.costCenterCode),
    currencyCode: assertCurrencyCode(input.currencyCode ?? 'BRL'),
    dueDate: requireDueDate(input.dueDate),
    paymentTerms: requireText(input.paymentTerms),
    description: requireText(input.description),
    receiptDocumentId,
    reimbursable: input.reimbursable !== false,
    items,
    totalAmount: computeExpenseTotal(items),
    idempotencyKey: requireText(input.idempotencyKey),
  };
}

export function validateExpenseVersionInput(input: ExpenseVersionInput): ExpenseVersionInput {
  return { version: requireVersion(input.version) };
}

export function validateRejectExpenseInput(input: RejectExpenseInput): RejectExpenseInput {
  return {
    version: requireVersion(input.version),
    reason: requireText(input.reason),
  };
}
