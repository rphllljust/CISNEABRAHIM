import { Link } from 'react-router-dom';
import {
  ASSET_OPERATIONAL_AVAILABILITIES,
  type PhysicalAsset,
} from '../types/physical-asset.types';
import { resolveAssetOperationalStatus } from '../utils/asset-operational-status';

type AssetOperationalStatusCellProps = {
  asset: PhysicalAsset;
};

const MODIFIER_BY_KIND = {
  [ASSET_OPERATIONAL_AVAILABILITIES.Available]: 'available',
  [ASSET_OPERATIONAL_AVAILABILITIES.Allocated]: 'allocated',
  [ASSET_OPERATIONAL_AVAILABILITIES.Unavailable]: 'unavailable',
} as const;

export function AssetOperationalStatusCell({ asset }: AssetOperationalStatusCellProps) {
  const status = resolveAssetOperationalStatus(asset);
  const modifier = MODIFIER_BY_KIND[status.kind];

  return (
    <div className="flex min-w-[8rem] flex-col gap-0.5">
      <span
        className={`assets-status assets-operational-status assets-operational-status--${modifier}`}
        aria-label={`Disponibilidade operacional: ${status.label}`}
      >
        {status.label}
      </span>
      {status.detail ? (
        status.kind === ASSET_OPERATIONAL_AVAILABILITIES.Allocated && asset.currentAllocation ? (
          <Link
            to={`/app/service-orders/${asset.currentAllocation.serviceOrderId}/planning`}
            className="text-xs text-gray-500 no-underline hover:text-brand-700"
            onClick={(event) => event.stopPropagation()}
          >
            {status.detail}
          </Link>
        ) : (
          <span className="text-xs text-gray-500">{status.detail}</span>
        )
      ) : null}
    </div>
  );
}