import { moneyAmountsEqual, normalizeMoneyAmount } from '../../platform/kernel/money-math';
import { ProcurementError } from './procurement';

export const SUPPLIER_INVOICE_STATUSES = {
  Draft: 'DRAFT',
  Validated: 'VALIDATED',
  Rejected: 'REJECTED',
} as const;

export type SupplierInvoiceStatus =
  (typeof SUPPLIER_INVOICE_STATUSES)[keyof typeof SUPPLIER_INVOICE_STATUSES];

export function assertInvoiceCanValidate(status: string): void {
  if (status !== SUPPLIER_INVOICE_STATUSES.Draft) {
    throw new ProcurementError('PROCUREMENT_INVALID_STATE');
  }
}

export function assertInvoiceAmountMatches(invoiceTotal: string, expected: string): void {
  if (!moneyAmountsEqual(normalizeMoneyAmount(invoiceTotal), normalizeMoneyAmount(expected))) {
    throw new ProcurementError('SUPPLIER_INVOICE_AMOUNT_MISMATCH');
  }
}

export function assertInvoiceMatchesRelatedSupplier(
  invoiceSupplierId: string,
  relatedSupplierId: string,
): void {
  if (invoiceSupplierId !== relatedSupplierId) {
    throw new ProcurementError('PROCUREMENT_INVALID');
  }
}

export function assertInvoiceMatchesRelatedUnit(invoiceUnitId: string, relatedUnitId: string): void {
  if (invoiceUnitId !== relatedUnitId) {
    throw new ProcurementError('PROCUREMENT_INVALID');
  }
}

export function assertInvoiceMatchesRelatedCurrency(
  invoiceCurrency: string,
  relatedCurrency: string,
): void {
  if (invoiceCurrency !== relatedCurrency) {
    throw new ProcurementError('PROCUREMENT_INVALID');
  }
}
