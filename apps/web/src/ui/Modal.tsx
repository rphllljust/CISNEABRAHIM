import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from './utils/cn';

export type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function Modal({ open, title, description, onClose, children, footer, className }: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open) {
      lastFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }

    if (dialog.open) {
      dialog.close();
    }
    lastFocusedRef.current?.focus();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'w-[min(32rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-auto rounded-[var(--radius-lg)] border-0 p-0 shadow-[var(--shadow-dialog)] backdrop:bg-black/45',
        className,
      )}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <div className="bg-surface-raised p-5">
        <h2 id={titleId} className="cisne-type-section-title">
          {title}
        </h2>
        {description ? (
          <p id={descriptionId} className="cisne-type-subtitle mt-2">
            {description}
          </p>
        ) : null}
        <div className="mt-4">{children}</div>
        {footer ? <div className="mt-4 flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </dialog>
  );
}
