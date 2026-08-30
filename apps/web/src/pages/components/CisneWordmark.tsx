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
      <span className="cisne-wordmark__primary" aria-hidden="true">
        CISNE
      </span>
      <span className="cisne-wordmark__region" aria-hidden="true">
        RONDÔNIA
      </span>
      <span className="cisne-wordmark__accent" aria-hidden="true" />
    </div>
  );
}
