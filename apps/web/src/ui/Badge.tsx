import type { ReactNode } from 'react';
import { cn } from './utils/cn';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'error' | 'info';

export type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken text-text-secondary border-border-subtle',
  success: 'bg-success-bg text-success-fg border-success-border',
  warning: 'bg-warning-bg text-warning-fg border-warning-border',
  error: 'bg-error-bg text-error-fg border-error-border',
  info: 'bg-info-bg text-info-fg border-info-border',
};

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
