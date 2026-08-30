import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './utils/cn';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'error' | 'info';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-gray-100 text-gray-700 ring-gray-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  error: 'bg-red-50 text-red-700 ring-red-500/20',
  info: 'bg-brand-50 text-brand-700 ring-brand-600/20',
};

export function Badge({ children, tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
