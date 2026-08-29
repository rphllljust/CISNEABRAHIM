export const UNIT_OF_MEASURE_CATEGORIES = [
  'COUNT',
  'TIME',
  'LENGTH',
  'AREA',
  'VOLUME',
  'MASS',
  'DISTANCE',
  'SERVICE',
] as const;

export type UnitOfMeasureCategory = (typeof UNIT_OF_MEASURE_CATEGORIES)[number];

export const UNIT_OF_MEASURE_STATUSES = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const;

export type UnitOfMeasureStatus =
  (typeof UNIT_OF_MEASURE_STATUSES)[keyof typeof UNIT_OF_MEASURE_STATUSES];

const UNIT_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_]{0,31}$/;

export function normalizeUnitCode(code: string): string {
  return code.trim().toUpperCase();
}

export function isValidUnitCodeFormat(code: string): boolean {
  return UNIT_CODE_PATTERN.test(normalizeUnitCode(code));
}
