import { describe, expect, it } from 'vitest';
import {
  assertCommercialConfiguration,
  CommercialValidationError,
  normalizePricingModelInput,
} from './commercial-compatibility';

describe('commercial compatibility', () => {
  it('accepts global price independent from internal cost', () => {
    const result = assertCommercialConfiguration({
      measurementBasis: 'GLOBAL_COMPLETION',
      measurementMode: 'BY_EVENT',
      allowedUnitCodes: ['SERVICE'],
      pricingModels: [
        {
          modelCode: 'GLOBAL_PRICE',
          salePrice: '96000',
          internalCost: '85000',
        },
      ],
    });

    expect(result.pricingModels[0]?.salePrice).toBe('96000.0000');
    expect(result.pricingModels[0]?.internalCost).toBe('85000.0000');
    expect(result.pricingModels[0]?.salePrice).not.toBe(result.pricingModels[0]?.internalCost);
  });

  it('accepts negotiated PO unit price', () => {
    const model = normalizePricingModelInput(
      {
        modelCode: 'NEGOTIATED_PO_PRICE',
        unitCode: 'UA',
        salePrice: '9351',
      },
      0,
    );
    expect(model.modelCode).toBe('NEGOTIATED_PO_PRICE');
    expect(model.unitCode).toBe('UA');
    expect(model.salePrice).toBe('9351.0000');
  });

  it('rejects incompatible unit of measure for pricing model', () => {
    expect(() =>
      assertCommercialConfiguration({
        measurementBasis: 'DISTANCE',
        measurementMode: 'BY_QUANTITY',
        allowedUnitCodes: ['DAY'],
        pricingModels: [{ modelCode: 'PER_KM' }],
      }),
    ).toThrow(CommercialValidationError);
  });

  it('rejects incompatible measurement mode for basis', () => {
    expect(() =>
      assertCommercialConfiguration({
        measurementBasis: 'TIME',
        measurementMode: 'BY_QUANTITY',
        allowedUnitCodes: ['HOUR'],
        pricingModels: [{ modelCode: 'HOURLY' }],
      }),
    ).toThrow(CommercialValidationError);
  });
});
