import type { ReactNode } from 'react';
import { cn } from './utils/cn';

export type TooltipProps = {
  content: string;
  children: ReactNode;
  className?: string;
};

export function Tooltip({ content, children, className }: TooltipProps) {
  return (
    <span className={cn('group relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-[var(--z-dropdown)] mb-2 hidden -translate-x-1/2 rounded-[var(--radius-sm)] bg-cisne-brand-strong px-2 py-1 text-xs text-text-inverse group-hover:block group-focus-within:block"
      >
        {content}
      </span>
    </span>
  );
}
