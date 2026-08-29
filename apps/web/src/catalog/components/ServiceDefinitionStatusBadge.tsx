import { CATALOG_LINEAGE_STATUSES, type CatalogLineageStatus } from '../types/service-catalog.types';

type ServiceDefinitionStatusBadgeProps = {
  status: CatalogLineageStatus;
};

export function ServiceDefinitionStatusBadge({ status }: ServiceDefinitionStatusBadgeProps) {
  const label = status === CATALOG_LINEAGE_STATUSES.Active ? 'Ativo' : 'Inativo';
  const className =
    status === CATALOG_LINEAGE_STATUSES.Active
      ? 'catalog-status catalog-status--active'
      : 'catalog-status catalog-status--inactive';

  return (
    <span className={className} aria-label={`Status da definição: ${label}`}>
      {label}
    </span>
  );
}
