import { cn } from '../../ui/utils/cn';

type CisneWordmarkProps = {
  compact?: boolean;
  className?: string;
};

export function CisneWordmark({ compact = false, className }: CisneWordmarkProps) {
  return (
    <div
      className={cn('cisne-wordmark', compact && 'cisne-wordmark--compact', className)}
      aria-label="CISNE Rondônia"
    >
      <span className="cisne-wordmark__seal" aria-hidden="true">
        <span>C</span>
      </span>
      <span className="cisne-wordmark__copy" aria-hidden="true">
        <span className="cisne-wordmark__primary">Cisne</span>
        <span className="cisne-wordmark__region">RONDÔNIA</span>
      </span>
      <span className="cisne-wordmark__rule" aria-hidden="true" />
    </div>
  );
}
