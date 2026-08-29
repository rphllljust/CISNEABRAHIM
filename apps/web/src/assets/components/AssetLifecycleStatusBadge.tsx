import { ASSET_LIFECYCLE_STATUSES, type AssetLifecycleStatus } from '../types/physical-asset.types';

type AssetLifecycleStatusBadgeProps = {
  status: AssetLifecycleStatus;
};

const LABELS: Record<AssetLifecycleStatus, string> = {
  [ASSET_LIFECYCLE_STATUSES.Active]: 'Ativo',
  [ASSET_LIFECYCLE_STATUSES.Inactive]: 'Inativo',
};

export function AssetLifecycleStatusBadge({ status }: AssetLifecycleStatusBadgeProps) {
  const modifier = status === ASSET_LIFECYCLE_STATUSES.Active ? 'active' : 'inactive';
  return (
    <span
      className={`assets-status assets-lifecycle-status assets-lifecycle-status--${modifier}`}
      aria-label={`Status de cadastro: ${LABELS[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
