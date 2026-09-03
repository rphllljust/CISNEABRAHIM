import { describe, expect, it } from 'vitest';
import { ProcurementError } from './procurement';
import {
  assertInvoiceAmountMatches,
  assertInvoiceCanValidate,
  assertInvoiceMatchesRelatedSupplier,
} from './supplier-invoice';

describe('supplier invoice domain', () => {
  it('keeps SupplierInvoice distinct from Payable and only validates drafts', () => {
    expect(() => assertInvoiceCanValidate('DRAFT')).not.toThrow();
    expect(() => assertInvoiceCanValidate('VALIDATED')).toThrow(ProcurementError);
    expect(() => assertInvoiceCanValidate('REJECTED')).toThrow(ProcurementError);
  });

  it('rejects amount divergence from the related order or receipt', () => {
    expect(() => assertInvoiceAmountMatches('100.0000', '100')).not.toThrow();
    expect(() => assertInvoiceAmountMatches('99.0000', '100.0000')).toThrow(ProcurementError);
    expect(() => assertInvoiceMatchesRelatedSupplier('a', 'b')).toThrow(ProcurementError);
  });
});
