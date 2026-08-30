import { MEASUREMENT_STATUSES, type MeasurementStatus } from '../types/measurement.types';

const STATUS_LABELS: Record<MeasurementStatus, string> = {
  [MEASUREMENT_STATUSES.Draft]: 'Rascunho',
  [MEASUREMENT_STATUSES.Submitted]: 'Submetida',
  [MEASUREMENT_STATUSES.UnderReview]: 'Em análise',
  [MEASUREMENT_STATUSES.Approved]: 'Aprovada',
  [MEASUREMENT_STATUSES.Rejected]: 'Rejeitada',
};

type MeasurementStatusBadgeProps = {
  status: MeasurementStatus;
};

export function MeasurementStatusBadge({ status }: MeasurementStatusBadgeProps) {
  const modifier = status.toLowerCase().replace(/_/g, '-');
  return (
    <span className={`measurement-status measurement-status--${modifier}`}>
      <span className="measurement-sr-only">Status da medição:</span>
      {STATUS_LABELS[status]}
    </span>
  );
}
