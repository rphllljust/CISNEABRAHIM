import { describe, expect, it } from 'vitest';
import { isValidLaborTypeCodeFormat, normalizeLaborTypeCode } from './operational-labor-type';

describe('operational-labor-type', () => {
  it('normalizes codes to uppercase', () => {
    expect(normalizeLaborTypeCode('driver')).toBe('DRIVER');
  });

  it('accepts baseline labor type codes', () => {
    expect(isValidLaborTypeCodeFormat('ELECTRICIAN')).toBe(true);
    expect(isValidLaborTypeCodeFormat('CONSTRUCTION_WORKER')).toBe(true);
  });
});
