import { cn } from './utils/cn';

export type SkeletonProps = {
  className?: string;
  lines?: number;
};

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  if (lines <= 1) {
    return (
      <div
        aria-hidden="true"
        className={cn('h-4 animate-pulse rounded-[var(--radius-sm)] bg-border-subtle', className)}
      />
    );
  }

  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} className="h-4 animate-pulse rounded-[var(--radius-sm)] bg-border-subtle" />
      ))}
    </div>
  );
}
