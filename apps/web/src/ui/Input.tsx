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
        'block w-full rounded-md border-0 bg-white py-2 px-3 text-sm text-gray-900 ring-1 ring-gray-300 ring-inset outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-70',
        invalid && 'ring-red-500/30 bg-red-50',
        className,
      )}
      {...props}
    />
  );
});
