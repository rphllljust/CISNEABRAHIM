import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from './utils/cn';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, invalid, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'block w-full min-h-[var(--spacing-touch)] rounded-[var(--radius-md)] border border-border-strong bg-surface-raised px-3 py-2 text-sm text-text-primary focus-visible:cisne-focus-ring disabled:cursor-not-allowed disabled:opacity-70',
        invalid && 'border-error-border bg-error-bg',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
