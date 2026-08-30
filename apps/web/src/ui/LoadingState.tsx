import { cn } from './utils/cn';

export type LoadingStateProps = {
  label?: string;
  className?: string;
};

export function LoadingState({ label = 'Carregando…', className }: LoadingStateProps) {
  return (
    <p role="status" aria-live="polite" aria-busy="true" className={cn('text-sm text-text-secondary', className)}>
      {label}
    </p>
  );
}
