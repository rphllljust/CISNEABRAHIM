import { assertCurrencyCode, isPositiveMoneyAmount, normalizeMoneyAmount } from '../../platform/kernel/money-math';
import { assertUuid } from '../../platform/kernel/uuid';
import { ProcurementError } from './procurement';

export type CreateSupplierInvoiceInput = {
  unitId: string;
  supplierId: string;
  invoiceNumber: string;
  issuedOn: string;
  dueDate: string;
  currencyCode?: string;
  totalAmount: string;
  paymentTerms: string;
  supplierPurchaseOrderId?: string;
  goodsReceiptId?: string;
  idempotencyKey: string;
};

export type ValidateSupplierInvoiceInput = {
  version: number;
  expenseCategoryId: string;
  costCenterId: string;
  costCenterCode: string;
};

function requireText(value: string | undefined, code = 'PROCUREMENT_INVALID'): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    throw new ProcurementError(code);
  }
  return trimmed;
}

function requireIsoDate(value: string | undefined, field: string): string {
  const trimmed = requireText(value);
  if (!/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    throw new ProcurementError('PROCUREMENT_INVALID');
  }
  void field;
  return trimmed.slice(0, 10);
}

function requireVersion(version: number): number {
  if (!Number.isInteger(version) || version < 1) {
    throw new ProcurementError('PROCUREMENT_VERSION_CONFLICT');
  }
  return version;
}

export function validateCreateSupplierInvoiceInput(input: CreateSupplierInvoiceInput): {
  unitId: string;
  supplierId: string;
  invoiceNumber: string;
  issuedOn: string;
  dueDate: string;
  currencyCode: string;
  totalAmount: string;
  paymentTerms: string;
  supplierPurchaseOrderId: string | null;
  goodsReceiptId: string | null;
  idempotencyKey: string;
} {
  assertUuid(input.supplierId, 'supplierId');
  const totalAmount = normalizeMoneyAmount(input.totalAmount);
  if (!isPositiveMoneyAmount(totalAmount)) {
    throw new ProcurementError('PROCUREMENT_INVALID');
  }
  if (input.supplierPurchaseOrderId) {
    assertUuid(input.supplierPurchaseOrderId, 'supplierPurchaseOrderId');
  }
  if (input.goodsReceiptId) {
    assertUuid(input.goodsReceiptId, 'goodsReceiptId');
  }
  return {
    unitId: requireText(input.unitId),
    supplierId: input.supplierId,
    invoiceNumber: requireText(input.invoiceNumber),
    issuedOn: requireIsoDate(input.issuedOn, 'issuedOn'),
    dueDate: requireIsoDate(input.dueDate, 'dueDate'),
    currencyCode: assertCurrencyCode(input.currencyCode ?? 'BRL'),
    totalAmount,
    paymentTerms: requireText(input.paymentTerms),
    supplierPurchaseOrderId: input.supplierPurchaseOrderId ?? null,
    goodsReceiptId: input.goodsReceiptId ?? null,
    idempotencyKey: requireText(input.idempotencyKey),
  };
}

export function validateValidateSupplierInvoiceInput(
  input: ValidateSupplierInvoiceInput,
): ValidateSupplierInvoiceInput {
  assertUuid(input.expenseCategoryId, 'expenseCategoryId');
  assertUuid(input.costCenterId, 'costCenterId');
  return {
    version: requireVersion(input.version),
    expenseCategoryId: input.expenseCategoryId,
    costCenterId: input.costCenterId,
    costCenterCode: requireText(input.costCenterCode),
  };
}
