export const LINEAGE_STATUSES = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const;

export type LineageStatus = (typeof LINEAGE_STATUSES)[keyof typeof LINEAGE_STATUSES];

export const VERSION_STATUSES = {
  Draft: 'DRAFT',
  Published: 'ACTIVE',
  Retired: 'RETIRED',
} as const;

export type VersionDbStatus = (typeof VERSION_STATUSES)[keyof typeof VERSION_STATUSES];

export type VersionApiStatus = 'DRAFT' | 'PUBLISHED' | 'RETIRED';

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

export type OperationalArchetype = (typeof OPERATIONAL_ARCHETYPES)[number];

export const MEASUREMENT_MODES = [
  'BY_PERIOD',
  'BY_QUANTITY',
  'BY_EVENT',
  'CHECKLIST',
] as const;

export type MeasurementMode = (typeof MEASUREMENT_MODES)[number];

export function toVersionApiStatus(status: VersionDbStatus): VersionApiStatus {
  if (status === VERSION_STATUSES.Published) {
    return 'PUBLISHED';
  }
  if (status === VERSION_STATUSES.Retired) {
    return 'RETIRED';
  }
  return 'DRAFT';
}
