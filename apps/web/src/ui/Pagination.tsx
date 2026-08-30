import { Button } from './Button';
import { cn } from './utils/cn';

export type PaginationProps = {
  pageLabel: string;
  onPrevious?: () => void;
  onNext?: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  className?: string;
};

export function Pagination({
  pageLabel,
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
  className,
}: PaginationProps) {
  return (
    <nav aria-label="Paginação" className={cn('flex flex-wrap items-center gap-3', className)}>
      {onPrevious ? (
        <Button type="button" variant="secondary" onClick={onPrevious} disabled={previousDisabled}>
          Anterior
        </Button>
      ) : null}
      <span className="text-sm text-gray-600" aria-current="page">
        {pageLabel}
      </span>
      {onNext ? (
        <Button type="button" variant="secondary" onClick={onNext} disabled={nextDisabled}>
          Próxima
        </Button>
      ) : null}
    </nav>
  );
}
