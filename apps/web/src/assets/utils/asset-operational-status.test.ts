import { describe, expect, it } from 'vitest';
import {
  ASSET_ALLOCATION_STATUSES,
  ASSET_LIFECYCLE_STATUSES,
  ASSET_OPERATIONAL_AVAILABILITIES,
} from '../types/physical-asset.types';
import {
  formatAssetPaginationRange,
  resolveAssetOperationalStatus,
} from './asset-operational-status';

const baseAsset = {
  id: 'asset-1',
  assetCode: 'TRK-001',
  resourceTypeId: 'truck',
  resourceTypeCode: 'TRUCK',
  resourceTypeClassification: 'VEHICLE',
  name: 'Caminhao pipa',
  unitId: 'unit-a',
  version: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deactivatedAt: null,
  vehicle: { plate: 'ABC-1234', chassis: null, model: null },
  currentAllocation: null,
};

describe('resolveAssetOperationalStatus', () => {
  it('marks inactive assets as unavailable', () => {
    expect(
      resolveAssetOperationalStatus({
        ...baseAsset,
        lifecycleStatus: ASSET_LIFECYCLE_STATUSES.Inactive,
        allocationStatus: ASSET_ALLOCATION_STATUSES.Available,
      }),
    ).toEqual({
      kind: ASSET_OPERATIONAL_AVAILABILITIES.Unavailable,
      label: 'Indisponível',
      detail: 'Cadastro inativo',
    });
  });

  it('shows service order when allocated', () => {
    expect(
      resolveAssetOperationalStatus({
        ...baseAsset,
        lifecycleStatus: ASSET_LIFECYCLE_STATUSES.Active,
        allocationStatus: ASSET_ALLOCATION_STATUSES.Allocated,
        currentAllocation: {
          serviceOrderId: 'so-1',
          orderNumber: 'OS-2026-0001',
        },
      }),
    ).toEqual({
      kind: ASSET_OPERATIONAL_AVAILABILITIES.Allocated,
      label: 'Alocado',
      detail: 'OS-2026-0001',
    });
  });

  it('marks active unallocated assets as available', () => {
    expect(
      resolveAssetOperationalStatus({
        ...baseAsset,
        lifecycleStatus: ASSET_LIFECYCLE_STATUSES.Active,
        allocationStatus: ASSET_ALLOCATION_STATUSES.Available,
      }),
    ).toEqual({
      kind: ASSET_OPERATIONAL_AVAILABILITIES.Available,
      label: 'Disponível',
      detail: null,
    });
  });

  it('prioritizes inactive lifecycle over allocated status', () => {
    expect(
      resolveAssetOperationalStatus({
        ...baseAsset,
        lifecycleStatus: ASSET_LIFECYCLE_STATUSES.Inactive,
        allocationStatus: ASSET_ALLOCATION_STATUSES.Allocated,
        currentAllocation: {
          serviceOrderId: 'so-1',
          orderNumber: 'OS-2026-0001',
        },
      }).kind,
    ).toBe(ASSET_OPERATIONAL_AVAILABILITIES.Unavailable);
  });

  it('uses current allocation instead of stale allocationStatus flag', () => {
    expect(
      resolveAssetOperationalStatus({
        ...baseAsset,
        lifecycleStatus: ASSET_LIFECYCLE_STATUSES.Active,
        allocationStatus: ASSET_ALLOCATION_STATUSES.Allocated,
        currentAllocation: null,
      }),
    ).toEqual({
      kind: ASSET_OPERATIONAL_AVAILABILITIES.Available,
      label: 'Disponível',
      detail: null,
    });
  });
});

describe('formatAssetPaginationRange', () => {
  it('formats non-empty ranges', () => {
    expect(formatAssetPaginationRange(20, 20, 20, 86)).toBe('21–40 de 86 ativos');
  });

  it('formats empty totals', () => {
    expect(formatAssetPaginationRange(0, 20, 0, 0)).toBe('0 ativos');
  });
});
