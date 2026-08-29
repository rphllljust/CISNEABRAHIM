import { VERSION_STATUSES, type VersionStatus } from '../types/service-catalog.types';

type VersionStatusBadgeProps = {
  status: VersionStatus;
};

const LABELS: Record<VersionStatus, string> = {
  [VERSION_STATUSES.Draft]: 'Rascunho',
  [VERSION_STATUSES.Published]: 'Publicada',
  [VERSION_STATUSES.Retired]: 'Aposentada',
};

export function VersionStatusBadge({ status }: VersionStatusBadgeProps) {
  const className = `catalog-version-status catalog-version-status--${status.toLowerCase()}`;
  return (
    <span className={className} aria-label={`Status da versão: ${LABELS[status]}`}>
      {LABELS[status]}
    </span>
  );
}
