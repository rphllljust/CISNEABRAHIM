import { describe, expect, it } from 'vitest';
import {
  isValidPhysicalResourceTypeCodeFormat,
  normalizePhysicalResourceTypeCode,
} from './physical-resource-type';

describe('physical-resource-type', () => {
  it('normalizes codes to uppercase', () => {
    expect(normalizePhysicalResourceTypeCode('water_truck')).toBe('WATER_TRUCK');
  });

  it('accepts baseline codes', () => {
    expect(isValidPhysicalResourceTypeCodeFormat('WATER_TRUCK')).toBe(true);
    expect(isValidPhysicalResourceTypeCodeFormat('LIFTING_EQUIPMENT')).toBe(true);
  });

  it('rejects invalid code formats', () => {
    expect(isValidPhysicalResourceTypeCodeFormat('')).toBe(false);
    expect(isValidPhysicalResourceTypeCodeFormat('_INVALID')).toBe(false);
  });
});
