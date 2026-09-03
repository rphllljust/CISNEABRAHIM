import { describe, expect, it } from 'vitest';
import {
  ProcurementError,
  assertOrderCanCancel,
  assertOrderCanReceive,
  assertReceiptDoesNotExceed,
  assertRequestCanApprove,
  assertRequestCanIssue,
  assertRequestCanSubmit,
  deriveSupplierPurchaseOrderStatus,
  multiplyQuantityByUnitAmount,
} from './procurement';

describe('procurement domain', () => {
  it('keeps CustomerPurchaseOrder out of the supplier request state machine', () => {
    expect(() => assertRequestCanSubmit('DRAFT')).not.toThrow();
    expect(() => assertRequestCanSubmit('APPROVED')).toThrow(ProcurementError);
    expect(() => assertRequestCanApprove('PENDING_APPROVAL')).not.toThrow();
    expect(() => assertRequestCanApprove('DRAFT')).toThrow(ProcurementError);
    expect(() => assertRequestCanIssue('APPROVED')).not.toThrow();
    expect(() => assertRequestCanIssue('PENDING_APPROVAL')).toThrow(ProcurementError);
  });

  it('allows partial receipt and rejects over-receipt', () => {
    expect(() => assertReceiptDoesNotExceed('100', '40', '60')).not.toThrow();
    expect(() => assertReceiptDoesNotExceed('100', '40', '61')).toThrow(ProcurementError);
    expect(deriveSupplierPurchaseOrderStatus('100', '40')).toBe('PARTIALLY_RECEIVED');
    expect(deriveSupplierPurchaseOrderStatus('100', '100')).toBe('RECEIVED');
    expect(multiplyQuantityByUnitAmount('2', '50')).toBe('100');
  });

  it('blocks receive or cancel after a posted receipt', () => {
    expect(() => assertOrderCanReceive('ISSUED')).not.toThrow();
    expect(() => assertOrderCanReceive('CANCELLED')).toThrow(ProcurementError);
    expect(() => assertOrderCanCancel('ISSUED', '0')).not.toThrow();
    expect(() => assertOrderCanCancel('ISSUED', '10')).toThrow(ProcurementError);
  });
});
