import { useId, type ReactNode } from 'react';
import { cn } from './utils/cn';
import { FieldError } from './FieldError';

export type FieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function Field({ label, htmlFor, hint, error, required, children, className }: FieldProps) {
  const generatedId = useId();
  const fieldId = htmlFor ?? generatedId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={fieldId} className="mb-1.5 block text-xs font-semibold text-gray-700">
        {label}
        {required ? (
          <span className="text-error-fg" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
        {required ? <span className="cisne-sr-only"> (obrigatório)</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className="cisne-type-caption">
          {hint}
        </p>
      ) : null}
      <div aria-describedby={describedBy}>{children}</div>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}
