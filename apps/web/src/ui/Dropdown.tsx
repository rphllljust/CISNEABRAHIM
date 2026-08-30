import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { cn } from './utils/cn';

export type DropdownItem = {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
};

export type DropdownProps = {
  trigger: ReactNode;
  items: DropdownItem[];
  label: string;
  className?: string;
};

export function Dropdown({ trigger, items, label, className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
        className="focus-visible:cisne-focus-ring"
      >
        {trigger}
      </button>
      {open ? (
        <ul
          id={menuId}
          role="menu"
          className="absolute right-0 z-[var(--z-dropdown)] mt-1 min-w-[12rem] rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised py-1 shadow-[var(--shadow-dialog)]"
        >
          {items.map((item) => (
            <li key={item.id} role="none">
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-sunken focus-visible:cisne-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => {
                  item.onSelect();
                  setOpen(false);
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
