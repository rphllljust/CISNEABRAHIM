import type { ReactNode } from 'react';
import { Alert } from './Alert';
import { Button } from './Button';
import { cn } from './utils/cn';

export type ErrorStateKind = 'generic' | 'denied' | 'not_found' | 'unavailable';

export type ErrorStateProps = {
  kind?: ErrorStateKind;
  title: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
};

const kindTone: Record<ErrorStateKind, 'error' | 'warning' | 'info'> = {
  generic: 'error',
  denied: 'warning',
  not_found: 'info',
  unavailable: 'warning',
};

export function ErrorState({
  kind = 'generic',
  title,
  message,
  retryLabel = 'Tentar novamente',
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <Alert tone={kindTone[kind]} title={title} role="alert">
        {message}
      </Alert>
      <div className="flex flex-wrap gap-2">
        {onRetry ? (
          <Button type="button" variant="secondary" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null}
        {action}
      </div>
    </div>
  );
}
