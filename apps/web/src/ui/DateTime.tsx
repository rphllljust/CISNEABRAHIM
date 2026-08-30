import { formatDatePtBr, formatDateTimePtBr } from './format/datetime';
import { cn } from './utils/cn';

export type DateTimeProps = {
  value: string | null | undefined;
  mode?: 'date' | 'datetime';
  className?: string;
};

export function DateTime({ value, mode = 'datetime', className }: DateTimeProps) {
  const formatted = mode === 'date' ? formatDatePtBr(value) : formatDateTimePtBr(value);

  return (
    <time dateTime={value ?? undefined} className={cn('text-sm text-text-primary', className)}>
      {formatted}
    </time>
  );
}
