import type { MeasurementMode } from '../../catalog/domain/service-catalog-status';
import {
  assertCurrencyCode,
  MoneyValidationError,
  normalizeMoneyAmount,
  parseOptionalMoneyAmount,
} from './money';
import type { MeasurementBasis } from './measurement-model';
import {
  defaultMeasurementModeForBasis,
  isMeasurementBasis,
  isMeasurementModeCompatibleWithBasis,
} from './measurement-model';
import type { CommercialPricingModelCode } from './pricing-model';
import {
  isCommercialPricingModelCode,
  resolvePricingModelStorage,
} from './pricing-model';

export class CommercialValidationError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export type PricingModelInput = {
  modelCode: string;
  unitCode?: string | null;
  salePrice?: string | null;
  internalCost?: string | null;
  currencyCode?: string;
  sortOrder?: number;
};

export type NormalizedPricingModelInput = {
  modelCode: CommercialPricingModelCode;
  unitCode: string | null;
  salePrice: string | null;
  internalCost: string | null;
  currencyCode: string;
  sortOrder: number;
};

export type PersistedPricingModelRow = {
  persistedCode: string;
  commercialCode: CommercialPricingModelCode;
  unitCode: string | null;
  salePrice: string | null;
  internalCost: string | null;
  currencyCode: string;
  sortOrder: number;
  config: { schemaVersion: 1; commercialCode: string; unitCode?: string } | null;
};

export function normalizePricingModelInput(
  input: PricingModelInput,
  index: number,
): NormalizedPricingModelInput {
  const modelCode = input.modelCode.trim().toUpperCase();
  if (!isCommercialPricingModelCode(modelCode)) {
    throw new CommercialValidationError('INVALID_PRICING_MODEL');
  }

  const storage = resolvePricingModelStorage(modelCode);
  const unitCode = (input.unitCode ?? storage.impliedUnitCode ?? null)?.trim().toUpperCase() ?? null;

  if (storage.requiredUnitCode && unitCode !== storage.requiredUnitCode) {
    throw new CommercialValidationError('PRICING_MODEL_UNIT_MISMATCH');
  }

  if (modelCode === 'UNIT_PRICE' && !unitCode) {
    throw new CommercialValidationError('PRICING_MODEL_UNIT_REQUIRED');
  }

  let salePrice: string | null;
  let internalCost: string | null;
  try {
    salePrice = parseOptionalMoneyAmount(input.salePrice);
    internalCost = parseOptionalMoneyAmount(input.internalCost);
  } catch (error) {
    if (error instanceof MoneyValidationError) {
      throw new CommercialValidationError(error.code);
    }
    throw error;
  }

  if (salePrice !== null) {
    salePrice = normalizeMoneyAmount(salePrice);
  }
  if (internalCost !== null) {
    internalCost = normalizeMoneyAmount(internalCost);
  }

  let currencyCode: string;
  try {
    currencyCode = assertCurrencyCode(input.currencyCode);
  } catch (error) {
    if (error instanceof MoneyValidationError) {
      throw new CommercialValidationError(error.code);
    }
    throw error;
  }

  return {
    modelCode,
    unitCode,
    salePrice,
    internalCost,
    currencyCode,
    sortOrder: input.sortOrder ?? index,
  };
}

export function assertPricingModels(inputs: PricingModelInput[]): NormalizedPricingModelInput[] {
  if (inputs.length === 0) {
    throw new CommercialValidationError('PRICING_MODELS_REQUIRED');
  }

  const normalized = inputs.map((input, index) => normalizePricingModelInput(input, index));
  const codes = new Set<string>();
  for (const model of normalized) {
    if (codes.has(model.modelCode)) {
      throw new CommercialValidationError('DUPLICATE_PRICING_MODEL');
    }
    codes.add(model.modelCode);
  }
  return normalized;
}

export function toPersistedPricingModel(model: NormalizedPricingModelInput): PersistedPricingModelRow {
  const storage = resolvePricingModelStorage(model.modelCode);
  return {
    persistedCode: storage.persistedCode,
    commercialCode: model.modelCode,
    unitCode: model.unitCode,
    salePrice: model.salePrice,
    internalCost: model.internalCost,
    currencyCode: model.currencyCode,
    sortOrder: model.sortOrder,
    config: {
      schemaVersion: 1,
      commercialCode: model.modelCode,
      ...(model.unitCode ? { unitCode: model.unitCode } : {}),
    },
  };
}

export function assertCommercialConfiguration(input: {
  measurementBasis: string;
  measurementMode: MeasurementMode;
  allowedUnitCodes: string[];
  pricingModels: PricingModelInput[];
}): {
  measurementBasis: MeasurementBasis;
  pricingModels: NormalizedPricingModelInput[];
} {
  const basisRaw = input.measurementBasis.trim().toUpperCase();
  if (!isMeasurementBasis(basisRaw)) {
    throw new CommercialValidationError('INVALID_MEASUREMENT_BASIS');
  }
  const measurementBasis = basisRaw;

  if (!isMeasurementModeCompatibleWithBasis(measurementBasis, input.measurementMode)) {
    throw new CommercialValidationError('MEASUREMENT_MODE_INCOMPATIBLE');
  }

  const pricingModels = assertPricingModels(input.pricingModels);
  const allowedUnits = new Set(input.allowedUnitCodes.map((code) => code.trim().toUpperCase()));

  for (const model of pricingModels) {
    if (model.unitCode && !allowedUnits.has(model.unitCode)) {
      throw new CommercialValidationError('PRICING_UNIT_NOT_ALLOWED');
    }
  }

  if (measurementBasis === 'GLOBAL_COMPLETION') {
    const hasGlobal = pricingModels.some((model) => model.modelCode === 'GLOBAL_PRICE');
    if (!hasGlobal && !pricingModels.some((model) => model.modelCode === 'NEGOTIATED_PO_PRICE')) {
      // global completion services typically pair with global or PO pricing — soft policy only for explicit global
    }
  }

  const defaultMode = defaultMeasurementModeForBasis(measurementBasis);
  if (input.measurementMode !== defaultMode && measurementBasis !== 'GLOBAL_COMPLETION') {
    // allow compatible alternate modes only where defined
  }

  return { measurementBasis, pricingModels };
}

export function assertMeasurementBasis(value: string): MeasurementBasis {
  const normalized = value.trim().toUpperCase();
  if (!isMeasurementBasis(normalized)) {
    throw new CommercialValidationError('INVALID_MEASUREMENT_BASIS');
  }
  return normalized;
}
