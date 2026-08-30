import type { ReactNode } from 'react';
import { cn } from './utils/cn';

export type FieldErrorProps = {
  id?: string;
  children: ReactNode;
  className?: string;
};

export function FieldError({ id, children, className }: FieldErrorProps) {
  return (
    <p id={id} role="alert" className={cn('text-sm text-error-fg', className)}>
      {children}
    </p>
  );
}
