import { useId, type ReactNode } from 'react';
import { cn } from './utils/cn';

export type TabItem = {
  id: string;
  label: string;
  panel: ReactNode;
  disabled?: boolean;
};

export type TabsProps = {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
};

export function Tabs({ items, activeId, onChange, label, className }: TabsProps) {
  const baseId = useId();

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className="flex flex-wrap gap-1 border-b border-border-subtle">
        {items.map((item) => {
          const selected = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${baseId}-${item.id}-tab`}
              aria-selected={selected}
              aria-controls={`${baseId}-${item.id}-panel`}
              disabled={item.disabled}
              className={cn(
                'min-h-[var(--spacing-touch)] rounded-t-[var(--radius-md)] px-3 text-sm font-medium focus-visible:cisne-focus-ring disabled:cursor-not-allowed disabled:opacity-60',
                selected
                  ? 'border border-b-0 border-border-subtle bg-surface-raised text-cisne-action'
                  : 'text-text-secondary hover:bg-surface-sunken',
              )}
              onClick={() => onChange(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => {
        const selected = item.id === activeId;
        return (
          <div
            key={item.id}
            role="tabpanel"
            id={`${baseId}-${item.id}-panel`}
            aria-labelledby={`${baseId}-${item.id}-tab`}
            hidden={!selected}
            className="py-4"
          >
            {selected ? item.panel : null}
          </div>
        );
      })}
    </div>
  );
}
