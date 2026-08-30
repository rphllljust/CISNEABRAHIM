import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './utils/cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, readOnly, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      readOnly={readOnly}
      aria-invalid={invalid || undefined}
      className={cn(
        'block w-full min-h-[var(--spacing-touch)] rounded-[var(--radius-md)] border border-border-strong bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:cisne-focus-ring disabled:cursor-not-allowed disabled:opacity-70 read-only:bg-surface-sunken read-only:text-text-secondary',
        invalid && 'border-error-border bg-error-bg',
        className,
      )}
      {...props}
    />
  );
});
