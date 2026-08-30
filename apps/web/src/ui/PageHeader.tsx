import type { ReactNode } from 'react';
import { cn } from './utils/cn';

export type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, meta, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-5 flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm text-gray-500">{description}</p> : null}
        {meta ? <div className="mt-3 text-sm text-gray-500">{meta}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
