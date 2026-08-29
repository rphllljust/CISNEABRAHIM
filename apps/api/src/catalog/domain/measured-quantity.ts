import { CatalogValidationError } from './service-catalog.validation';

export function assertQuantityDecimalScale(value: number, decimalScale: number): void {
  if (!Number.isFinite(value)) {
    throw new CatalogValidationError('INVALID_QUANTITY');
  }
  if (decimalScale < 0 || decimalScale > 6) {
    throw new CatalogValidationError('INVALID_DECIMAL_SCALE');
  }
  if (decimalScale === 0 && !Number.isInteger(value)) {
    throw new CatalogValidationError('QUANTITY_PRECISION_EXCEEDED');
  }
  const factor = 10 ** decimalScale;
  const scaled = value * factor;
  if (Math.abs(scaled - Math.round(scaled)) > 1e-9) {
    throw new CatalogValidationError('QUANTITY_PRECISION_EXCEEDED');
  }
}

export function quantityExceedsScale(value: number, decimalScale: number): boolean {
  try {
    assertQuantityDecimalScale(value, decimalScale);
    return false;
  } catch (error) {
    if (error instanceof CatalogValidationError && error.code === 'QUANTITY_PRECISION_EXCEEDED') {
      return true;
    }
    throw error;
  }
}
