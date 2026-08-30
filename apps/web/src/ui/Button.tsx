import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from './utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  loadingText?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-cisne-action text-text-inverse border border-cisne-action hover:bg-cisne-action-hover active:bg-cisne-brand disabled:opacity-70',
  secondary:
    'bg-surface-raised text-cisne-action border border-cisne-action hover:bg-cisne-action-muted active:bg-info-bg disabled:opacity-70',
  ghost:
    'bg-transparent text-cisne-action border border-transparent hover:bg-info-bg active:bg-cisne-action-muted disabled:opacity-70',
  danger:
    'bg-fin-negative-fg text-text-inverse border border-fin-negative-fg hover:opacity-90 active:opacity-100 disabled:opacity-70',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading = false, loadingText, className, disabled, children, type = 'button', ...props },
  ref,
) {
  const isDisabled = disabled || loading;
  const accessibleName = typeof children === 'string' ? children : undefined;
  const loadingAriaLabel = loadingText
    ? `Carregando: ${loadingText.replace(/…$/, '')}`
    : `Carregando: ${accessibleName ?? 'ação'}`;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-label={loading ? loadingAriaLabel : accessibleName}
      className={cn(
        'inline-flex min-h-[var(--spacing-touch)] items-center justify-center gap-2 rounded-[var(--radius-md)] px-3.5 py-2 text-sm font-semibold transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] focus-visible:cisne-focus-ring disabled:cursor-not-allowed',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <span className="cisne-sr-only">{loadingText ?? 'Carregando'}</span>
          <span aria-hidden="true">{loadingText ?? '…'}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});
