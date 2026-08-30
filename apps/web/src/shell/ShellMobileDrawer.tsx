import { useEffect, useRef } from 'react';
import { ShellNavList } from './ShellNavList';
import { useBodyScrollLock } from './hooks/useBodyScrollLock';

type ShellMobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  alertCount?: number;
  alertsLoading?: boolean;
};

export function ShellMobileDrawer({ open, onClose, alertCount, alertsLoading }: ShellMobileDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) {
      return;
    }
    lastFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      return;
    }
    lastFocusedRef.current?.focus();
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div role="presentation">
      <button
        type="button"
        className="shell-drawer-backdrop"
        aria-label="Fechar menu de navegação"
        onClick={onClose}
      />
      <aside className="shell-drawer" role="dialog" aria-modal="true" aria-label="Menu de navegação">
        <header className="shell-drawer__header">
          <p className="shell-drawer__title">Cisne Rondônia</p>
          <button
            ref={closeButtonRef}
            type="button"
            className="shell-drawer__close"
            onClick={onClose}
          >
            Fechar
          </button>
        </header>
        <ShellNavList
          onNavigate={onClose}
          alertCount={alertCount}
          alertsLoading={alertsLoading}
        />
      </aside>
    </div>
  );
}
