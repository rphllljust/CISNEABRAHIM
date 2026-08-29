export const PHYSICAL_RESOURCE_CLASSIFICATIONS = [
  'VEHICLE',
  'MACHINE',
  'EQUIPMENT',
  'CONSUMABLE',
  'MATERIAL',
] as const;

export type PhysicalResourceClassification =
  (typeof PHYSICAL_RESOURCE_CLASSIFICATIONS)[number];

export const PHYSICAL_RESOURCE_TYPE_STATUSES = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const;

export type PhysicalResourceTypeStatus =
  (typeof PHYSICAL_RESOURCE_TYPE_STATUSES)[keyof typeof PHYSICAL_RESOURCE_TYPE_STATUSES];

const RESOURCE_TYPE_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_]{0,63}$/;

export function normalizePhysicalResourceTypeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function isValidPhysicalResourceTypeCodeFormat(code: string): boolean {
  return RESOURCE_TYPE_CODE_PATTERN.test(normalizePhysicalResourceTypeCode(code));
}
