import { VARIANCE_LABELS, type VarianceKind } from '../utils/measurement-variance';

type MeasurementVarianceBadgeProps = {
  variance: VarianceKind;
};

export function MeasurementVarianceBadge({ variance }: MeasurementVarianceBadgeProps) {
  const modifier = variance.replace(/_/g, '-');
  return (
    <span className={`measurement-variance measurement-variance--${modifier}`}>
      {VARIANCE_LABELS[variance]}
    </span>
  );
}
