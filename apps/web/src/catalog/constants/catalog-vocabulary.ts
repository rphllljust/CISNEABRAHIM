export const OPERATIONAL_ARCHETYPES = [
  'RENTAL',
  'TRANSPORT',
  'CIVIL_WORK',
  'INSTALLATION',
  'MAINTENANCE',
  'INDUSTRIAL_SERVICE',
  'FACILITY_SERVICE',
  'COMMERCIAL_REPRESENTATION',
  'GOODS_TRADE',
  'LABOR_SERVICE',
  'WASTE_SERVICE',
  'MARITIME_SUPPORT',
] as const;

export const MEASUREMENT_MODES = ['BY_PERIOD', 'BY_QUANTITY', 'BY_EVENT', 'CHECKLIST'] as const;

export const MEASUREMENT_BASES = [
  'UNIT',
  'TIME',
  'DISTANCE',
  'VOLUME',
  'WEIGHT',
  'TRIP',
  'GLOBAL_COMPLETION',
] as const;

export const PRICING_MODEL_CODES = [
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

export const EXECUTION_REQUIREMENT_TYPES = [
  'PHOTO',
  'DOCUMENT',
  'SIGNATURE',
  'START_TIME',
  'END_TIME',
  'LOCATION',
  'MILEAGE',
  'HOUR_METER',
  'QUANTITY',
  'WEIGHT',
  'VOLUME',
  'RECEIPT',
  'OBSERVATION',
] as const;

export const EXECUTION_CONDITION_TYPES = [
  'WHEN_MEASUREMENT_BASIS_IS',
  'WHEN_ARCHETYPE_IS',
  'WHEN_RESOURCE_TYPE_IS',
  'WHEN_LABOR_TYPE_IS',
] as const;

export const ARCHETYPE_LABELS: Record<string, string> = {
  RENTAL: 'Locação',
  TRANSPORT: 'Transporte',
  CIVIL_WORK: 'Obra civil',
  INSTALLATION: 'Instalação',
  MAINTENANCE: 'Manutenção',
  INDUSTRIAL_SERVICE: 'Serviço industrial',
  FACILITY_SERVICE: 'Facility services',
  COMMERCIAL_REPRESENTATION: 'Representação comercial',
  GOODS_TRADE: 'Comércio de bens',
  LABOR_SERVICE: 'Mão de obra',
  WASTE_SERVICE: 'Resíduos',
  MARITIME_SUPPORT: 'Apoio marítimo',
};
