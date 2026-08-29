import type { ServiceRequestStatus } from '../types/service-request.types';
import { formatServiceRequestStatus } from '../utils/service-request-labels';

type ServiceRequestStatusBadgeProps = {
  status: ServiceRequestStatus;
};

const STATUS_CLASS: Record<ServiceRequestStatus, string> = {
  DRAFT: 'requests-status--draft',
  SUBMITTED: 'requests-status--submitted',
  UNDER_REVIEW: 'requests-status--review',
  APPROVED: 'requests-status--approved',
  REJECTED: 'requests-status--rejected',
  CANCELLED: 'requests-status--cancelled',
  CONVERTED: 'requests-status--converted',
};

export function ServiceRequestStatusBadge({ status }: ServiceRequestStatusBadgeProps) {
  const label = formatServiceRequestStatus(status);
  return (
    <span className={`requests-status ${STATUS_CLASS[status]}`} aria-label={`Status: ${label}`}>
      {label}
    </span>
  );
}
