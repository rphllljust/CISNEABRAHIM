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
    'border border-brand-600 bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-700 disabled:opacity-70',
  secondary:
    'border border-gray-300 bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-70',
  ghost:
    'border border-transparent bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-70',
  danger:
    'border border-red-700 bg-red-700 text-white hover:opacity-90 active:opacity-100 disabled:opacity-70',
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
        'inline-flex min-h-[var(--spacing-touch)] items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed',
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
