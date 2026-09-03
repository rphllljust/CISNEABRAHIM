import {
  buildListPhysicalAssetsQuery,
  buildPhysicalAssetSummaryQuery,
  getPhysicalAssetSummary,
  listPhysicalAssets,
  type ListPhysicalAssetsParams,
  type PhysicalAssetSummaryParams,
} from '../../assets/api/physical-assets-api';
import {
  VEHICLE_CLASSIFICATION,
  type PhysicalAssetListResponse,
  type PhysicalAssetListSummary,
} from '../../assets/types/physical-asset.types';

export type ListFleetVehiclesParams = Omit<ListPhysicalAssetsParams, 'classification'>;

export function buildListFleetVehiclesQuery(params: ListFleetVehiclesParams): string {
  return buildListPhysicalAssetsQuery({
    ...params,
    classification: VEHICLE_CLASSIFICATION,
  });
}

export function buildFleetSummaryQuery(
  params: Omit<PhysicalAssetSummaryParams, 'classification'> = {},
): string {
  return buildPhysicalAssetSummaryQuery({
    ...params,
    classification: VEHICLE_CLASSIFICATION,
  });
}

export async function listFleetVehicles(
  params: ListFleetVehiclesParams,
  signal?: AbortSignal,
): Promise<PhysicalAssetListResponse> {
  return listPhysicalAssets({ ...params, classification: VEHICLE_CLASSIFICATION }, signal);
}

export async function getFleetSummary(
  params: Omit<PhysicalAssetSummaryParams, 'classification'> = {},
  signal?: AbortSignal,
): Promise<PhysicalAssetListSummary> {
  return getPhysicalAssetSummary(
    { ...params, classification: VEHICLE_CLASSIFICATION },
    signal,
  );
}
