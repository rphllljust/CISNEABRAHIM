import { describe, expect, it } from 'vitest';
import { fiscalDocumentPostingAmount, taxCalculationPostingAmount } from './fiscal-accounting';

describe('fiscal accounting amounts', () => {
  it('sums fiscal document line amounts without inventing tax or ledger accounts', () => {
    expect(
      fiscalDocumentPostingAmount([
        { lineAmount: '80.0000' },
        { lineAmount: '20.0000' },
      ]),
    ).toBe('100.0000');
  });

  it('rejects a non-positive tax calculation result', () => {
    expect(() => taxCalculationPostingAmount('0.0000')).toThrowError('FISCAL_INVALID_AMOUNT');
  });
});
