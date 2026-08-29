import { ASSET_ALLOCATION_STATUSES, type AssetAllocationStatus } from '../types/physical-asset.types';

type AssetAllocationStatusBadgeProps = {
  status: AssetAllocationStatus;
};

const LABELS: Record<AssetAllocationStatus, string> = {
  [ASSET_ALLOCATION_STATUSES.Available]: 'Disponível',
  [ASSET_ALLOCATION_STATUSES.Allocated]: 'Alocado',
};

export function AssetAllocationStatusBadge({ status }: AssetAllocationStatusBadgeProps) {
  const modifier = status === ASSET_ALLOCATION_STATUSES.Available ? 'available' : 'allocated';
  return (
    <span
      className={`assets-status assets-allocation-status assets-allocation-status--${modifier}`}
      aria-label={`Status de alocação: ${LABELS[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
