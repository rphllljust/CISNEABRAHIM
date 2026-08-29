import { CLIENT_STATUSES, type ClientStatus } from '../types/client.types';

type ClientStatusBadgeProps = {
  status: ClientStatus;
};

export function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
  const label = status === CLIENT_STATUSES.Active ? 'Ativo' : 'Inativo';
  const className =
    status === CLIENT_STATUSES.Active ? 'client-status client-status--active' : 'client-status client-status--inactive';

  return (
    <span className={className} aria-label={`Status: ${label}`}>
      {label}
    </span>
  );
}
