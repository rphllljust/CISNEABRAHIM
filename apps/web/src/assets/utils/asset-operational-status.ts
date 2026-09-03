import {
  ASSET_LIFECYCLE_STATUSES,
  ASSET_OPERATIONAL_AVAILABILITIES,
  type AssetOperationalAvailability,
  type PhysicalAsset,
} from '../types/physical-asset.types';

export type AssetOperationalStatusKind = AssetOperationalAvailability;

export type AssetOperationalStatus = {
  kind: AssetOperationalStatusKind;
  label: string;
  detail: string | null;
};

export function resolveAssetOperationalStatus(asset: PhysicalAsset): AssetOperationalStatus {
  if (asset.lifecycleStatus === ASSET_LIFECYCLE_STATUSES.Inactive) {
    return {
      kind: ASSET_OPERATIONAL_AVAILABILITIES.Unavailable,
      label: 'Indisponível',
      detail: 'Cadastro inativo',
    };
  }

  if (asset.currentAllocation) {
    return {
      kind: ASSET_OPERATIONAL_AVAILABILITIES.Allocated,
      label: 'Alocado',
      detail: asset.currentAllocation.orderNumber,
    };
  }

  return {
    kind: ASSET_OPERATIONAL_AVAILABILITIES.Available,
    label: 'Disponível',
    detail: null,
  };
}

export function formatAssetPaginationRange(
  offset: number,
  _pageSize: number,
  pageCount: number,
  total: number,
): string {
  if (total === 0) {
    return '0 ativos';
  }
  const start = offset + 1;
  const end = offset + pageCount;
  return `${start}–${end} de ${total} ativos`;
}

export function formatAssetCount(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}
