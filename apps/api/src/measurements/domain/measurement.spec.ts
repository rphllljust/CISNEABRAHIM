import { describe, expect, it } from 'vitest';
import {
  assertMeasuredQuantityWithinAuthorizedBounds,
  compareMeasuredQuantities,
  normalizeMeasuredQuantity,
} from './measurement-quantity';
import { MeasurementError } from './measurement';
import { validateItemMeasuredQuantity } from './measurement.validation';
import type { ServiceOrderServiceSnapshot } from '../../service-orders/domain/service-order-snapshot';

const SNAPSHOT: ServiceOrderServiceSnapshot = {
  serviceDefinitionId: 'svc',
  serviceDefinitionVersionId: 'ver',
  serviceCode: 'CODE',
  serviceName: 'Name',
  catalogVersion: 1,
  versionStatus: 'PUBLISHED',
  archetype: 'CIVIL_WORK',
  measurementModel: { mode: 'BY_QUANTITY', basis: 'VOLUME', defaultUnitCode: 'M3' },
  allowedUnits: [{ unitCode: 'M3', isDefault: true, sortOrder: 0 }],
  requirements: { execution: [], resources: [], labor: [] },
  snapshottedAt: new Date().toISOString(),
};

describe('measurement quantity rules', () => {
  it('normalizes decimal quantities', () => {
    expect(normalizeMeasuredQuantity('10.500')).toBe('10.5');
    expect(normalizeMeasuredQuantity('10')).toBe('10');
  });

  it('rejects measured quantity above actual without authorized adjustment', () => {
    expect(() =>
      assertMeasuredQuantityWithinAuthorizedBounds({
        actualQuantity: '10',
        measuredQuantity: '17',
        authorizedAdjustmentTotal: '0',
      }),
    ).toThrowError(MeasurementError);
  });

  it('allows measured quantity above actual when adjustment covers divergence', () => {
    expect(() =>
      assertMeasuredQuantityWithinAuthorizedBounds({
        actualQuantity: '10',
        measuredQuantity: '17',
        authorizedAdjustmentTotal: '7',
      }),
    ).not.toThrow();
  });

  it('validates item measured quantity with unit scale', () => {
    const result = validateItemMeasuredQuantity({
      measuredQuantity: '10.500',
      actualQuantity: '10',
      authorizedAdjustmentTotal: '1',
      unitCode: 'M3',
      unitDecimalScale: 3,
      serviceSnapshot: SNAPSHOT,
    });
    expect(result).toBe('10.5');
    expect(compareMeasuredQuantities(result, '10.5')).toBe(0);
  });
});
