import { describe, expect, it } from 'vitest';
import {
  toPhysicalAssetListSummaryResponse,
  toPhysicalAssetResponse,
  type PhysicalAssetDetail,
} from './physical-assets-response.serializer';

const baseDetail: PhysicalAssetDetail = {
  id: 'asset-1',
  asset_code: 'TRK-001',
  physical_resource_type_id: 'type-1',
  resource_type_code: 'TRUCK',
  resource_type_classification: 'VEHICLE',
  name: 'Caminhao pipa',
  lifecycle_status: 'ACTIVE',
  allocation_status: 'AVAILABLE',
  unit_id: 'unit-a',
  version: 1,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  deactivated_at: null,
  vehicle: {
    plate_display: 'ABC-1234',
    chassis: null,
    model: null,
  },
  current_allocation: null,
};

describe('toPhysicalAssetResponse', () => {
  it('maps current allocation when active service order exists', () => {
    const response = toPhysicalAssetResponse({
      ...baseDetail,
      allocation_status: 'ALLOCATED',
      current_allocation: {
        service_order_id: 'so-1',
        order_number: 'OS-2026-0001',
      },
    });

    expect(response.currentAllocation).toEqual({
      serviceOrderId: 'so-1',
      orderNumber: 'OS-2026-0001',
    });
    expect(response.allocationStatus).toBe('ALLOCATED');
    expect(response.vehicle?.plate).toBe('ABC-1234');
  });

  it('derives allocation status from current allocation instead of stored flag', () => {
    const response = toPhysicalAssetResponse({
      ...baseDetail,
      allocation_status: 'ALLOCATED',
      current_allocation: null,
    });

    expect(response.currentAllocation).toBeNull();
    expect(response.allocationStatus).toBe('AVAILABLE');
  });
});

describe('toPhysicalAssetListSummaryResponse', () => {
  it('maps summary counts without transformation', () => {
    expect(
      toPhysicalAssetListSummaryResponse({
        total: 10,
        available: 6,
        allocated: 3,
        unavailable: 1,
      }),
    ).toEqual({
      total: 10,
      available: 6,
      allocated: 3,
      unavailable: 1,
    });
  });
});
