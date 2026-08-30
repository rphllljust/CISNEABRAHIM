import { BILLING_RECORD_STATUSES } from '../types/billing.types';

const STATUS_LABELS: Record<string, string> = {
  [BILLING_RECORD_STATUSES.Prepared]: 'Em preparação',
  [BILLING_RECORD_STATUSES.Voided]: 'Anulado',
};

type BillingStatusBadgeProps = {
  status: string;
};

export function BillingStatusBadge({ status }: BillingStatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/_/g, '-');
  const label = STATUS_LABELS[status] ?? status;
  return <span className={`billing-status billing-status--${normalized}`}>{label}</span>;
}
