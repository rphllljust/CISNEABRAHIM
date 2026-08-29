import { describe, expect, it } from 'vitest';
import { assertQuantityDecimalScale, quantityExceedsScale } from './measured-quantity';

describe('measured-quantity', () => {
  it('accepts integers when decimal scale is zero', () => {
    expect(() => assertQuantityDecimalScale(10, 0)).not.toThrow();
  });

  it('rejects fractional values when decimal scale is zero', () => {
    expect(() => assertQuantityDecimalScale(1.5, 0)).toThrow();
    expect(quantityExceedsScale(1.5, 0)).toBe(true);
  });

  it('accepts values within decimal scale', () => {
    expect(() => assertQuantityDecimalScale(12.345, 3)).not.toThrow();
    expect(quantityExceedsScale(12.3456, 3)).toBe(true);
  });
});
