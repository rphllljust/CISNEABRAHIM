import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from './utils/cn';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, readOnly, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      readOnly={readOnly}
      aria-invalid={invalid || undefined}
      className={cn(
        'block w-full min-h-[5.5rem] resize-y rounded-[var(--radius-md)] border border-border-strong bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:cisne-focus-ring disabled:cursor-not-allowed disabled:opacity-70 read-only:bg-surface-sunken',
        invalid && 'border-error-border bg-error-bg',
        className,
      )}
      {...props}
    />
  );
});
