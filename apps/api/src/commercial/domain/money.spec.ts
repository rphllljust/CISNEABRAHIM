import { describe, expect, it } from 'vitest';
import { formatMoneyAmountForApi, normalizeMoneyAmount, parseOptionalMoneyAmount } from './money';

describe('money', () => {
  it('normalizes decimal precision to four fractional digits', () => {
    expect(normalizeMoneyAmount('96000')).toBe('96000.0000');
    expect(normalizeMoneyAmount('9351.5')).toBe('9351.5000');
    expect(formatMoneyAmountForApi('96000.0000')).toBe('96000');
    expect(formatMoneyAmountForApi('9351.5000')).toBe('9351.5');
  });

  it('formats derived negative amounts (overdraft balances, deltas) preserving the sign', () => {
    expect(formatMoneyAmountForApi('-12.5000')).toBe('-12.5');
    expect(formatMoneyAmountForApi('-0.2500')).toBe('-0.25');
    expect(formatMoneyAmountForApi('-0.0000')).toBe('0');
    expect(formatMoneyAmountForApi('-42')).toBe('-42');
  });

  it('rejects float-like invalid amounts and excess precision', () => {
    expect(() => normalizeMoneyAmount('-1')).toThrow();
    expect(() => normalizeMoneyAmount('12.34567')).toThrow();
    expect(() => parseOptionalMoneyAmount('not-money')).toThrow();
    expect(() => formatMoneyAmountForApi('--1')).toThrow();
    expect(() => formatMoneyAmountForApi('12.34567')).toThrow();
  });
});
