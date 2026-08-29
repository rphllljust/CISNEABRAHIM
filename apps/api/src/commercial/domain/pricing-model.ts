/**
 * Vocabulário comercial canônico (Prompt 39).
 * Mapeia para `cat.pricing_model_code` existente quando equivalente.
 */
export const COMMERCIAL_PRICING_MODELS = [
  'GLOBAL_PRICE',
  'UNIT_PRICE',
  'HOURLY',
  'DAILY',
  'MONTHLY',
  'PER_TRIP',
  'PER_KM',
  'PER_M3',
  'NEGOTIATED_PO_PRICE',
] as const;

export type CommercialPricingModelCode = (typeof COMMERCIAL_PRICING_MODELS)[number];

export const PERSISTED_PRICING_MODEL_CODES = [
  'FIXED',
  'PER_UNIT',
  'PER_PERIOD',
  'PER_TRIP',
  'TIERED',
  'CONTRACT_REFERENCE',
] as const;

export type PersistedPricingModelCode = (typeof PERSISTED_PRICING_MODEL_CODES)[number];

export type PricingModelStorage = {
  persistedCode: PersistedPricingModelCode;
  requiredUnitCode?: string;
  impliedUnitCode?: string;
};

const COMMERCIAL_TO_STORAGE: Record<CommercialPricingModelCode, PricingModelStorage> = {
  GLOBAL_PRICE: { persistedCode: 'FIXED' },
  UNIT_PRICE: { persistedCode: 'PER_UNIT' },
  HOURLY: { persistedCode: 'PER_PERIOD', impliedUnitCode: 'HOUR', requiredUnitCode: 'HOUR' },
  DAILY: { persistedCode: 'PER_PERIOD', impliedUnitCode: 'DAY', requiredUnitCode: 'DAY' },
  MONTHLY: { persistedCode: 'PER_PERIOD', impliedUnitCode: 'MONTH', requiredUnitCode: 'MONTH' },
  PER_TRIP: { persistedCode: 'PER_TRIP', impliedUnitCode: 'TRIP', requiredUnitCode: 'TRIP' },
  PER_KM: { persistedCode: 'PER_UNIT', impliedUnitCode: 'KM', requiredUnitCode: 'KM' },
  PER_M3: { persistedCode: 'PER_UNIT', impliedUnitCode: 'M3', requiredUnitCode: 'M3' },
  NEGOTIATED_PO_PRICE: { persistedCode: 'CONTRACT_REFERENCE' },
};

export function isCommercialPricingModelCode(value: string): value is CommercialPricingModelCode {
  return (COMMERCIAL_PRICING_MODELS as readonly string[]).includes(value);
}

export function resolvePricingModelStorage(code: CommercialPricingModelCode): PricingModelStorage {
  return COMMERCIAL_TO_STORAGE[code];
}

export function commercialCodeFromPersisted(
  persistedCode: PersistedPricingModelCode,
  unitCode?: string | null,
): CommercialPricingModelCode | null {
  switch (persistedCode) {
    case 'FIXED':
      return 'GLOBAL_PRICE';
    case 'PER_TRIP':
      return 'PER_TRIP';
    case 'CONTRACT_REFERENCE':
      return 'NEGOTIATED_PO_PRICE';
    case 'PER_PERIOD':
      if (unitCode === 'HOUR') return 'HOURLY';
      if (unitCode === 'DAY') return 'DAILY';
      if (unitCode === 'MONTH') return 'MONTHLY';
      return null;
    case 'PER_UNIT':
      if (unitCode === 'KM') return 'PER_KM';
      if (unitCode === 'M3') return 'PER_M3';
      return 'UNIT_PRICE';
    default:
      return null;
  }
}

export const PRICING_MODEL_POLICIES = COMMERCIAL_PRICING_MODELS.map((code) => {
  const storage = COMMERCIAL_TO_STORAGE[code];
  return {
    code,
    persistedCode: storage.persistedCode,
    requiredUnitCode: storage.requiredUnitCode ?? null,
    impliedUnitCode: storage.impliedUnitCode ?? null,
    description:
      code === 'GLOBAL_PRICE'
        ? 'Preço global comercial — não exige soma dos recursos internos.'
        : code === 'NEGOTIATED_PO_PRICE'
          ? 'Preço negociado por ordem de compra (PO).'
          : null,
  };
});
