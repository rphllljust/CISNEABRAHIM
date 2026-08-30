import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './utils/cn';

export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'>;

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      role="switch"
      className={cn(
        'h-6 w-11 appearance-none rounded-full border border-border-strong bg-border-subtle transition-colors checked:border-cisne-action checked:bg-cisne-action focus-visible:cisne-focus-ring disabled:cursor-not-allowed disabled:opacity-70',
        className,
      )}
      {...props}
    />
  );
});
