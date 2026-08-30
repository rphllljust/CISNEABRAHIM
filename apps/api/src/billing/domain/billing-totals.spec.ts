import { describe, expect, it } from 'vitest';
import { moneyAmountsEqual, sumMoneyAmounts } from './billing-totals';

describe('billing totals', () => {
  it('sums line amounts with numeric precision', () => {
    expect(sumMoneyAmounts(['1000.0000', '250.5000', '0.0001'])).toBe('1250.5001');
  });

  it('compares monetary amounts without float drift', () => {
    expect(moneyAmountsEqual('1000.0000', '1000')).toBe(true);
    expect(moneyAmountsEqual('1000.0001', '1000.0000')).toBe(false);
  });
});
