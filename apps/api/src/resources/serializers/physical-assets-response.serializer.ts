import type {
  AssetAllocationStatus,
  AssetLifecycleStatus,
} from '../domain/physical-asset';

export type VehicleProfileRow = {
  plate_display: string;
  chassis: string | null;
  model: string | null;
};

export type PhysicalAssetRow = {
  id: string;
  asset_code: string;
  physical_resource_type_id: string;
  resource_type_code: string;
  resource_type_classification: string;
  name: string;
  lifecycle_status: AssetLifecycleStatus;
  allocation_status: AssetAllocationStatus;
  unit_id: string;
  version: number;
  created_at: string;
  updated_at: string;
  deactivated_at: string | null;
};

export type PhysicalAssetDetail = PhysicalAssetRow & {
  vehicle: VehicleProfileRow | null;
};

export type PhysicalAssetResponse = {
  id: string;
  assetCode: string;
  resourceTypeId: string;
  resourceTypeCode: string;
  resourceTypeClassification: string;
  name: string;
  lifecycleStatus: AssetLifecycleStatus;
  allocationStatus: AssetAllocationStatus;
  unitId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  deactivatedAt: string | null;
  vehicle: {
    plate: string;
    chassis: string | null;
    model: string | null;
  } | null;
};

export function toPhysicalAssetResponse(detail: PhysicalAssetDetail): PhysicalAssetResponse {
  return {
    id: detail.id,
    assetCode: detail.asset_code,
    resourceTypeId: detail.physical_resource_type_id,
    resourceTypeCode: detail.resource_type_code,
    resourceTypeClassification: detail.resource_type_classification,
    name: detail.name,
    lifecycleStatus: detail.lifecycle_status,
    allocationStatus: detail.allocation_status,
    unitId: detail.unit_id,
    version: detail.version,
    createdAt: detail.created_at,
    updatedAt: detail.updated_at,
    deactivatedAt: detail.deactivated_at,
    vehicle: detail.vehicle
      ? {
          plate: detail.vehicle.plate_display,
          chassis: detail.vehicle.chassis,
          model: detail.vehicle.model,
        }
      : null,
  };
}
