import { Badge, type BadgeTone } from './Badge';

export type StatusBadgeTone = BadgeTone | 'operational' | 'financial';

export type StatusBadgeProps = {
  label: string;
  tone?: StatusBadgeTone;
  description?: string;
};

const toneMap: Record<StatusBadgeTone, BadgeTone> = {
  neutral: 'neutral',
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
  operational: 'info',
  financial: 'warning',
};

export function StatusBadge({ label, tone = 'neutral', description }: StatusBadgeProps) {
  const ariaLabel = description ? `Status: ${label}. ${description}` : `Status: ${label}`;

  return (
    <span aria-label={ariaLabel}>
      <Badge tone={toneMap[tone]}>{label}</Badge>
    </span>
  );
}
