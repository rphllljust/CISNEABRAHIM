import { describe, expect, it } from 'vitest';
import { detectCommercialTermsMismatch, paymentTermsMatch } from './payment-terms';

describe('payment terms', () => {
  it('detects mismatch between PO and declared terms', () => {
    expect(paymentTermsMatch('07 DDL', '07 ddl')).toBe(true);
    expect(detectCommercialTermsMismatch('07 DDL', 'À vista')).toBe(true);
    expect(detectCommercialTermsMismatch('07 DDL', '07 DDL')).toBe(false);
  });
});
