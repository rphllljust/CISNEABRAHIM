import { formatPurchaseOrderStatus } from '../utils/purchase-order-labels';
import { PURCHASE_ORDER_STATUSES } from '../types/purchase-order.types';

const STATUS_CLASS: Record<string, string> = {
  [PURCHASE_ORDER_STATUSES.Draft]: 'status-badge status-badge--draft',
  [PURCHASE_ORDER_STATUSES.Registered]: 'status-badge status-badge--approved',
  [PURCHASE_ORDER_STATUSES.Cancelled]: 'status-badge status-badge--cancelled',
};

type PurchaseOrderStatusBadgeProps = {
  status: string;
};

export function PurchaseOrderStatusBadge({ status }: PurchaseOrderStatusBadgeProps) {
  const label = formatPurchaseOrderStatus(status);
  const className = STATUS_CLASS[status] ?? 'status-badge';

  return (
    <span className={className} aria-label={`Status: ${label}`}>
      {label}
    </span>
  );
}
