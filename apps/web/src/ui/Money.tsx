import { formatMoneyBrl, isNegativeMoney } from './format/money';
import { cn } from './utils/cn';

export type MoneyProps = {
  value: string | null | undefined;
  currencyCode?: string;
  emphasis?: boolean;
  className?: string;
};

export function Money({ value, currencyCode = 'BRL', emphasis = false, className }: MoneyProps) {
  const negative = isNegativeMoney(value);

  return (
    <span
      className={cn(
        'cisne-type-money',
        emphasis && 'font-semibold',
        negative && 'text-fin-negative-fg',
        className,
      )}
    >
      {formatMoneyBrl(value, currencyCode)}
    </span>
  );
}
