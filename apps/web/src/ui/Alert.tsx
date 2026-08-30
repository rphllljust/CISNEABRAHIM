import type { ReactNode } from 'react';
import { cn } from './utils/cn';

export type AlertTone = 'success' | 'warning' | 'error' | 'info';

export type AlertProps = {
  tone: AlertTone;
  title?: string;
  children: ReactNode;
  className?: string;
  role?: 'alert' | 'status';
  id?: string;
};

const toneClasses: Record<AlertTone, string> = {
  success: 'border-success-border bg-success-bg text-success-fg',
  warning: 'border-warning-border bg-warning-bg text-warning-fg',
  error: 'border-error-border bg-error-bg text-error-fg',
  info: 'border-info-border bg-info-bg text-info-fg',
};

export function Alert({ tone, title, children, className, role, id }: AlertProps) {
  return (
    <div
      id={id}
      role={role ?? (tone === 'error' ? 'alert' : 'status')}
      className={cn('rounded-[var(--radius-md)] border px-3 py-2.5 text-sm', toneClasses[tone], className)}
    >
      {title ? <h2 className="mb-1 text-base font-semibold">{title}</h2> : null}
      <div>{children}</div>
    </div>
  );
}
