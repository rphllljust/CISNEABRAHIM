import { describe, expect, it } from 'vitest';
import { isValidUnitCodeFormat, normalizeUnitCode } from './unit-of-measure';

describe('unit-of-measure', () => {
  it('normalizes aliases to canonical uppercase codes', () => {
    expect(normalizeUnitCode('m3')).toBe('M3');
    expect(normalizeUnitCode(' day ')).toBe('DAY');
  });

  it('rejects free-form labels as unit codes', () => {
    expect(isValidUnitCodeFormat('metros cúbicos')).toBe(false);
    expect(isValidUnitCodeFormat('m³')).toBe(false);
  });
});
