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
        'block w-full rounded-md border-0 bg-white py-2 px-3 text-sm text-gray-900 ring-1 ring-gray-300 ring-inset outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-70',
        invalid && 'ring-red-500/30 bg-red-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
