import { describe, expect, it } from 'vitest';
import {
  ASSET_ALLOCATION_STATUSES,
  ASSET_LIFECYCLE_STATUSES,
  ASSET_OPERATIONAL_AVAILABILITIES,
  isValidAssetCodeFormat,
  isValidNormalizedPlate,
  normalizeAssetCode,
  normalizePlate,
  resolveAllocationStatusFromCurrentAllocation,
  resolveOperationalAvailability,
} from './physical-asset';

describe('physical-asset domain', () => {
  it('normalizes asset codes and plates', () => {
    expect(normalizeAssetCode(' trk-001 ')).toBe('TRK-001');
    expect(isValidAssetCodeFormat('TRK-001')).toBe(true);

    const plate = normalizePlate('abc-1d23');
    expect(plate.normalized).toBe('ABC1D23');
    expect(plate.display).toBe('ABC-1D23');
    expect(isValidNormalizedPlate(plate.normalized)).toBe(true);
  });

  it('derives allocation status from active service order allocation', () => {
    expect(resolveAllocationStatusFromCurrentAllocation(null)).toBe(
      ASSET_ALLOCATION_STATUSES.Available,
    );
    expect(
      resolveAllocationStatusFromCurrentAllocation({ service_order_id: 'so-1' }),
    ).toBe(ASSET_ALLOCATION_STATUSES.Allocated);
  });

  it('derives operational availability from lifecycle and current allocation', () => {
    expect(
      resolveOperationalAvailability(ASSET_LIFECYCLE_STATUSES.Inactive, {
        service_order_id: 'so-1',
      }),
    ).toBe(ASSET_OPERATIONAL_AVAILABILITIES.Unavailable);
    expect(
      resolveOperationalAvailability(ASSET_LIFECYCLE_STATUSES.Active, {
        service_order_id: 'so-1',
      }),
    ).toBe(ASSET_OPERATIONAL_AVAILABILITIES.Allocated);
    expect(resolveOperationalAvailability(ASSET_LIFECYCLE_STATUSES.Active, null)).toBe(
      ASSET_OPERATIONAL_AVAILABILITIES.Available,
    );
  });
});
