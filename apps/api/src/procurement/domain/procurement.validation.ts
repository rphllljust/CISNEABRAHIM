import { assertCurrencyCode, isPositiveMoneyAmount, normalizeMoneyAmount } from '../../platform/kernel/money-math';
import { assertUuid } from '../../platform/kernel/uuid';
import { multiplyQuantityByUnitAmount, ProcurementError } from './procurement';

export type CreatePurchaseRequestInput = {
  unitId: string;
  justification: string;
  currencyCode?: string;
  lines: Array<{ description: string; quantity: string; unitAmount: string }>;
};

export type VersionedProcurementInput = {
  version: number;
  reason?: string;
};

export type IssueSupplierPurchaseOrderInput = {
  version: number;
  supplierId: string;
  paymentTerms?: string;
};

export type ReceiveSupplierPurchaseOrderInput = {
  version: number;
  idempotencyKey: string;
  expenseCategoryId: string;
  costCenterId: string;
  costCenterCode: string;
  dueDate: string;
  lines: Array<{ spoLineId: string; quantity: string }>;
};

function requireText(value: string | undefined, code = 'PROCUREMENT_INVALID'): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    throw new ProcurementError(code);
  }
  return trimmed;
}

function requireVersion(version: number): number {
  if (!Number.isInteger(version) || version < 1) {
    throw new ProcurementError('PROCUREMENT_VERSION_CONFLICT');
  }
  return version;
}

export function validateCreatePurchaseRequestInput(input: CreatePurchaseRequestInput): {
  unitId: string;
  justification: string;
  currencyCode: string;
  lines: Array<{ description: string; quantity: string; unitAmount: string; lineAmount: string }>;
} {
  const unitId = requireText(input.unitId);
  const justification = requireText(input.justification);
  if (!Array.isArray(input.lines) || input.lines.length === 0) {
    throw new ProcurementError('PROCUREMENT_LINE_REQUIRED');
  }
  const lines = input.lines.map((line) => {
    const description = requireText(line.description);
    const quantity = normalizeMoneyAmount(line.quantity);
    const unitAmount = normalizeMoneyAmount(line.unitAmount);
    if (!isPositiveMoneyAmount(quantity) || !isPositiveMoneyAmount(unitAmount)) {
      throw new ProcurementError('PROCUREMENT_INVALID');
    }
    return {
      description,
      quantity,
      unitAmount,
      lineAmount: multiplyQuantityByUnitAmount(quantity, unitAmount),
    };
  });
  return {
    unitId,
    justification,
    currencyCode: assertCurrencyCode(input.currencyCode ?? 'BRL'),
    lines,
  };
}

export function validateVersionedInput(input: VersionedProcurementInput): VersionedProcurementInput {
  return {
    version: requireVersion(input.version),
    reason: input.reason?.trim() || undefined,
  };
}

export function validateIssueInput(input: IssueSupplierPurchaseOrderInput): IssueSupplierPurchaseOrderInput {
  assertUuid(input.supplierId, 'supplierId');
  return {
    version: requireVersion(input.version),
    supplierId: input.supplierId,
    paymentTerms: input.paymentTerms?.trim() || undefined,
  };
}

export function validateReceiveInput(input: ReceiveSupplierPurchaseOrderInput): ReceiveSupplierPurchaseOrderInput {
  const idempotencyKey = requireText(input.idempotencyKey);
  assertUuid(input.expenseCategoryId, 'expenseCategoryId');
  assertUuid(input.costCenterId, 'costCenterId');
  const costCenterCode = requireText(input.costCenterCode);
  const dueDate = requireText(input.dueDate);
  if (!/^\d{4}-\d{2}-\d{2}/.test(dueDate)) {
    throw new ProcurementError('PROCUREMENT_INVALID');
  }
  if (!Array.isArray(input.lines) || input.lines.length === 0) {
    throw new ProcurementError('PROCUREMENT_LINE_REQUIRED');
  }
  const lines = input.lines.map((line) => {
    assertUuid(line.spoLineId, 'spoLineId');
    const quantity = normalizeMoneyAmount(line.quantity);
    if (!isPositiveMoneyAmount(quantity)) {
      throw new ProcurementError('PROCUREMENT_INVALID');
    }
    return { spoLineId: line.spoLineId, quantity };
  });
  return {
    version: requireVersion(input.version),
    idempotencyKey,
    expenseCategoryId: input.expenseCategoryId,
    costCenterId: input.costCenterId,
    costCenterCode,
    dueDate: dueDate.slice(0, 10),
    lines,
  };
}

export function validateCancelReason(reason: string | undefined): string {
  return requireText(reason);
}
