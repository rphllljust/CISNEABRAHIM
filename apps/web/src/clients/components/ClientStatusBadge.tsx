import { Badge } from '../../ui/Badge';
import { CLIENT_STATUSES, type ClientStatus } from '../types/client.types';

type ClientStatusBadgeProps = {
  status: ClientStatus;
};

export function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
  const label = status === CLIENT_STATUSES.Active ? 'Ativo' : 'Inativo';

  return (
    <Badge tone={status === CLIENT_STATUSES.Active ? 'success' : 'error'} aria-label={`Status: ${label}`}>
      {label}
    </Badge>
  );
}
