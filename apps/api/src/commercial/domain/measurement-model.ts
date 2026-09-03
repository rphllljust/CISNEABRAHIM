const COMMERCIAL_MEASUREMENT_MODES = [
  'BY_PERIOD',
  'BY_QUANTITY',
  'BY_EVENT',
  'CHECKLIST',
] as const;

export type MeasurementMode = (typeof COMMERCIAL_MEASUREMENT_MODES)[number];

/**
 * Modelos de medição compatíveis com serviços (Prompt 39) — vocabulário/policies.
 * Distinto de `measurement_mode` persistido (BY_PERIOD, BY_QUANTITY, ...).
 */
export const MEASUREMENT_BASES = [
  'UNIT',
  'TIME',
  'DISTANCE',
  'VOLUME',
  'WEIGHT',
  'TRIP',
  'GLOBAL_COMPLETION',
] as const;

export type MeasurementBasis = (typeof MEASUREMENT_BASES)[number];

const BASIS_TO_DEFAULT_MODE: Record<MeasurementBasis, MeasurementMode> = {
  UNIT: 'BY_QUANTITY',
  TIME: 'BY_PERIOD',
  DISTANCE: 'BY_QUANTITY',
  VOLUME: 'BY_QUANTITY',
  WEIGHT: 'BY_QUANTITY',
  TRIP: 'BY_EVENT',
  GLOBAL_COMPLETION: 'BY_EVENT',
};

const BASIS_COMPATIBLE_MODES: Record<MeasurementBasis, readonly MeasurementMode[]> = {
  UNIT: ['BY_QUANTITY'],
  TIME: ['BY_PERIOD'],
  DISTANCE: ['BY_QUANTITY'],
  VOLUME: ['BY_QUANTITY'],
  WEIGHT: ['BY_QUANTITY'],
  TRIP: ['BY_EVENT'],
  GLOBAL_COMPLETION: ['BY_EVENT', 'CHECKLIST'],
};

const BASIS_SUGGESTED_UNITS: Record<MeasurementBasis, readonly string[]> = {
  UNIT: ['UN', 'UA', 'SERVICE'],
  TIME: ['HOUR', 'DAY', 'SHIFT', 'MONTH'],
  DISTANCE: ['KM', 'M'],
  VOLUME: ['M3'],
  WEIGHT: ['TON'],
  TRIP: ['TRIP'],
  GLOBAL_COMPLETION: ['SERVICE', 'UN'],
};

export function isMeasurementBasis(value: string): value is MeasurementBasis {
  return (MEASUREMENT_BASES as readonly string[]).includes(value);
}

export function defaultMeasurementModeForBasis(basis: MeasurementBasis): MeasurementMode {
  return BASIS_TO_DEFAULT_MODE[basis];
}

export function isMeasurementModeCompatibleWithBasis(
  basis: MeasurementBasis,
  mode: MeasurementMode,
): boolean {
  return BASIS_COMPATIBLE_MODES[basis].includes(mode);
}

export function suggestedUnitsForBasis(basis: MeasurementBasis): readonly string[] {
  return BASIS_SUGGESTED_UNITS[basis];
}

export function assertMeasurementMode(value: string): MeasurementMode {
  if (!(COMMERCIAL_MEASUREMENT_MODES as readonly string[]).includes(value)) {
    throw new Error('INVALID_MEASUREMENT_MODE');
  }
  return value as MeasurementMode;
}

export const MEASUREMENT_MODEL_POLICIES = MEASUREMENT_BASES.map((basis) => ({
  basis,
  defaultMeasurementMode: BASIS_TO_DEFAULT_MODE[basis],
  compatibleMeasurementModes: [...BASIS_COMPATIBLE_MODES[basis]],
  suggestedUnitCodes: [...BASIS_SUGGESTED_UNITS[basis]],
}));
