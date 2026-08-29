import { describe, expect, it } from 'vitest';
import {
  assertAllowedUnits,
  assertNonEmptyName,
  assertServiceCode,
  CatalogValidationError,
} from './service-catalog.validation';

describe('service-catalog.validation', () => {
  it('normalizes and validates service codes', () => {
    expect(assertServiceCode('locacao_caminhao_pipa')).toBe('LOCACAO_CAMINHAO_PIPA');
  });

  it('rejects invalid service codes', () => {
    expect(() => assertServiceCode('bad code')).toThrow(CatalogValidationError);
  });

  it('rejects empty names', () => {
    expect(() => assertNonEmptyName('   ')).toThrow(CatalogValidationError);
  });

  it('requires at least one allowed unit', () => {
    expect(() => assertAllowedUnits([])).toThrow(CatalogValidationError);
  });

  it('rejects multiple default units', () => {
    expect(() =>
      assertAllowedUnits([
        { unitCode: 'DAY', isDefault: true },
        { unitCode: 'HOUR', isDefault: true },
      ]),
    ).toThrow(CatalogValidationError);
  });
});
