import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from './utils/cn';

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  loading?: boolean;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, loading = false, className, disabled, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex h-[var(--spacing-touch)] w-[var(--spacing-touch)] items-center justify-center rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised text-text-primary transition-colors hover:bg-surface-sunken focus-visible:cisne-focus-ring disabled:cursor-not-allowed disabled:opacity-70',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
