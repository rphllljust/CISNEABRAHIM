export const OPERATIONAL_LABOR_TYPE_STATUSES = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const;

export type OperationalLaborTypeStatus =
  (typeof OPERATIONAL_LABOR_TYPE_STATUSES)[keyof typeof OPERATIONAL_LABOR_TYPE_STATUSES];

const LABOR_TYPE_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_]{0,63}$/;

export function normalizeLaborTypeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function isValidLaborTypeCodeFormat(code: string): boolean {
  return LABOR_TYPE_CODE_PATTERN.test(normalizeLaborTypeCode(code));
}
