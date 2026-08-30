import { cn } from './utils/cn';

export type ToastTone = 'success' | 'warning' | 'error' | 'info';

export type ToastProps = {
  tone: ToastTone;
  message: string;
  className?: string;
};

const toneClasses: Record<ToastTone, string> = {
  success: 'border-success-border bg-success-bg text-success-fg',
  warning: 'border-warning-border bg-warning-bg text-warning-fg',
  error: 'border-error-border bg-error-bg text-error-fg',
  info: 'border-info-border bg-info-bg text-info-fg',
};

export function Toast({ tone, message, className }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed bottom-4 right-4 z-[var(--z-toast)] max-w-sm rounded-[var(--radius-md)] border px-4 py-3 text-sm shadow-[var(--shadow-dialog)]',
        toneClasses[tone],
        className,
      )}
    >
      {message}
    </div>
  );
}
