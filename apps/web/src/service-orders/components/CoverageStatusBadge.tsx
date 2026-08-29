import type { RequirementCoverageRow } from '../utils/planning-aggregates';

type CoverageStatusBadgeProps = {
  status: RequirementCoverageRow['status'];
};

const LABELS: Record<RequirementCoverageRow['status'], string> = {
  complete: 'Completo',
  partial: 'Parcial',
  missing: 'Pendente',
  over: 'Excedente',
};

export function CoverageStatusBadge({ status }: CoverageStatusBadgeProps) {
  return (
    <span className={`planning-coverage-status planning-coverage-status--${status}`} aria-label={`Status: ${LABELS[status]}`}>
      {LABELS[status]}
    </span>
  );
}
