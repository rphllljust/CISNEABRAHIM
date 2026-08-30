import type { ReactNode } from 'react';
import { cn } from './utils/cn';

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('rounded-[var(--radius-lg)] border border-dashed border-border-default bg-surface-raised px-6 py-10 text-center', className)}>
      <h2 className="cisne-type-section-title">{title}</h2>
      {description ? <p className="cisne-type-subtitle mx-auto mt-2 max-w-md">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
