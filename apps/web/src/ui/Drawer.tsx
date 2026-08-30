import { useEffect, useId, type ReactNode } from 'react';
import { cn } from './utils/cn';

export type DrawerProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  side?: 'left' | 'right';
};

export function Drawer({ open, title, onClose, children, side = 'right' }: DrawerProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Fechar painel"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'absolute top-0 flex h-full w-[min(24rem,100vw)] flex-col border-border-subtle bg-surface-raised shadow-[var(--shadow-dialog)]',
          side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
        )}
      >
        <header className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <h2 id={titleId} className="cisne-type-section-title">
            {title}
          </h2>
          <button type="button" className="text-cisne-action focus-visible:cisne-focus-ring" onClick={onClose}>
            Fechar
          </button>
        </header>
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </aside>
    </div>
  );
}
