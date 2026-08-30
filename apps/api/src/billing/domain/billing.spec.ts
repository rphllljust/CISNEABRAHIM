import { describe, expect, it } from 'vitest';
import { assertMeasurementApprovedForBilling, BillingError } from './billing';

describe('billing domain guards', () => {
  it('requires approved measurement', () => {
    expect(() => assertMeasurementApprovedForBilling('APPROVED')).not.toThrow();
    expect(() => assertMeasurementApprovedForBilling('DRAFT')).toThrow(BillingError);
  });
});
