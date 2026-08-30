import type { ReactNode } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

export type ConfirmActionProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  confirmVariant?: 'primary' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
};

export function ConfirmAction({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  confirmDisabled = false,
  confirmVariant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmActionProps) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onCancel}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={confirmDisabled || loading}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
