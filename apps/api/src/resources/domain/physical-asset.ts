export const ASSET_LIFECYCLE_STATUSES = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const;

export type AssetLifecycleStatus =
  (typeof ASSET_LIFECYCLE_STATUSES)[keyof typeof ASSET_LIFECYCLE_STATUSES];

export const ASSET_ALLOCATION_STATUSES = {
  Available: 'AVAILABLE',
  Allocated: 'ALLOCATED',
} as const;

export type AssetAllocationStatus =
  (typeof ASSET_ALLOCATION_STATUSES)[keyof typeof ASSET_ALLOCATION_STATUSES];

export const ASSET_OPERATIONAL_AVAILABILITIES = {
  Available: 'AVAILABLE',
  Allocated: 'ALLOCATED',
  Unavailable: 'UNAVAILABLE',
} as const;

export type AssetOperationalAvailability =
  (typeof ASSET_OPERATIONAL_AVAILABILITIES)[keyof typeof ASSET_OPERATIONAL_AVAILABILITIES];

export function resolveAllocationStatusFromCurrentAllocation(
  currentAllocation: { service_order_id: string } | null | undefined,
): AssetAllocationStatus {
  return currentAllocation
    ? ASSET_ALLOCATION_STATUSES.Allocated
    : ASSET_ALLOCATION_STATUSES.Available;
}

export function resolveOperationalAvailability(
  lifecycleStatus: AssetLifecycleStatus,
  currentAllocation: { service_order_id: string } | null | undefined,
): AssetOperationalAvailability {
  if (lifecycleStatus === ASSET_LIFECYCLE_STATUSES.Inactive) {
    return ASSET_OPERATIONAL_AVAILABILITIES.Unavailable;
  }
  if (currentAllocation) {
    return ASSET_OPERATIONAL_AVAILABILITIES.Allocated;
  }
  return ASSET_OPERATIONAL_AVAILABILITIES.Available;
}

export const VEHICLE_CLASSIFICATION = 'VEHICLE';

const ASSET_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{1,63}$/;
const PLATE_NORMALIZED_PATTERN = /^[A-Z0-9]{7}$/;

export function normalizeAssetCode(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidAssetCodeFormat(code: string): boolean {
  return ASSET_CODE_PATTERN.test(code);
}

export function normalizePlate(value: string): { normalized: string; display: string } {
  const normalized = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const display = normalized.length === 7 ? `${normalized.slice(0, 3)}-${normalized.slice(3)}` : normalized;
  return { normalized, display };
}

export function isValidNormalizedPlate(plate: string): boolean {
  return PLATE_NORMALIZED_PATTERN.test(plate);
}
