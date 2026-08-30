import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './utils/cn';

export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type="radio"
      className={cn(
        'h-5 w-5 border border-border-strong text-cisne-action focus-visible:cisne-focus-ring disabled:cursor-not-allowed disabled:opacity-70',
        className,
      )}
      {...props}
    />
  );
});
