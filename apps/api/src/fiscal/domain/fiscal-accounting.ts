import { isPositiveMoneyAmount, normalizeMoneyAmount, sumMoneyAmounts } from '../../platform/kernel/money-math';
import { FiscalError } from './fiscal-document';

export const FISCAL_ACCOUNTING_ORIGIN = 'FISCAL';

export const FISCAL_ACCOUNTING_EVENTS = {
  Authorized: 'FISCAL_DOCUMENT_AUTHORIZED',
  Cancelled: 'FISCAL_DOCUMENT_CANCELLED',
  TaxConfirmed: 'TAX_CALCULATION_CONFIRMED',
} as const;

export function fiscalDocumentPostingAmount(items: Array<{ lineAmount: string }>): string {
  const total = sumMoneyAmounts(items.map((item) => item.lineAmount));
  if (!isPositiveMoneyAmount(total)) {
    throw new FiscalError('FISCAL_INVALID_AMOUNT');
  }
  return normalizeMoneyAmount(total);
}

export function taxCalculationPostingAmount(resultAmount: string): string {
  if (!isPositiveMoneyAmount(resultAmount)) {
    throw new FiscalError('FISCAL_INVALID_AMOUNT');
  }
  return normalizeMoneyAmount(resultAmount);
}
