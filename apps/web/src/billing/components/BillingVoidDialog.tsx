import { useId } from 'react';

type BillingVoidDialogProps = {
  open: boolean;
  voidReason: string;
  onVoidReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  confirming: boolean;
};

export function BillingVoidDialog({
  open,
  voidReason,
  onVoidReasonChange,
  onClose,
  onConfirm,
  confirming,
}: BillingVoidDialogProps) {
  const titleId = useId();

  if (!open) {
    return null;
  }

  return (
    <dialog className="billing-dialog" open aria-labelledby={titleId}>
      <form
        method="dialog"
        className="billing-dialog__panel"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm();
        }}
      >
        <h2 id={titleId}>Anular preparação</h2>
        <p>Esta ação marca a preparação como anulada. Não altera a medição nem emite documento fiscal.</p>
        <label className="billing-field">
          <span>Motivo (opcional)</span>
          <textarea value={voidReason} onChange={(event) => onVoidReasonChange(event.target.value)} rows={3} />
        </label>
        <div className="billing-dialog__actions">
          <button type="button" className="billing-button" onClick={onClose} disabled={confirming}>
            Cancelar
          </button>
          <button type="submit" className="billing-button billing-button--danger" disabled={confirming}>
            {confirming ? 'Anulando…' : 'Confirmar anulação'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
