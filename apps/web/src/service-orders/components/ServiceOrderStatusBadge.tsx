import { Badge, type BadgeTone } from '../../ui/Badge';
import type { ServiceOrderStatus } from '../types/service-order.types';
import { formatServiceOrderStatus } from '../utils/service-order-labels';

type ServiceOrderStatusBadgeProps = {
  status: ServiceOrderStatus;
};

const STATUS_TONE: Record<ServiceOrderStatus, BadgeTone> = {
  DRAFT: 'neutral',
  PREPARED: 'info',
  RELEASED: 'info',
  IN_EXECUTION: 'success',
  PAUSED: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'error',
};

export function ServiceOrderStatusBadge({ status }: ServiceOrderStatusBadgeProps) {
  const label = formatServiceOrderStatus(status);
  return (
    <Badge tone={STATUS_TONE[status]} aria-label={`Status: ${label}`}>
      {label}
    </Badge>
  );
}
