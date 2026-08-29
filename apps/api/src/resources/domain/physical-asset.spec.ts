import { describe, expect, it } from 'vitest';
import {
  isValidAssetCodeFormat,
  isValidNormalizedPlate,
  normalizeAssetCode,
  normalizePlate,
} from './physical-asset';

describe('physical-asset domain', () => {
  it('normalizes asset codes and plates', () => {
    expect(normalizeAssetCode(' trk-001 ')).toBe('TRK-001');
    expect(isValidAssetCodeFormat('TRK-001')).toBe(true);

    const plate = normalizePlate('abc-1d23');
    expect(plate.normalized).toBe('ABC1D23');
    expect(plate.display).toBe('ABC-1D23');
    expect(isValidNormalizedPlate(plate.normalized)).toBe(true);
  });
});
