import { cn } from '../../ui/utils/cn';

type CisneWordmarkProps = {
  className?: string;
};

export function CisneWordmark({ className }: CisneWordmarkProps) {
  return (
    <div className={cn('seal', className)} aria-label="CISNE Rondônia">
      <div className="ring" aria-hidden="true">
        <span>C</span>
      </div>
      <div className="wordmark" aria-hidden="true">
        <div className="name">Cisne</div>
        <div className="sub">Rondônia</div>
      </div>
    </div>
  );
}
