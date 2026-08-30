import { formatMoneyBrl, formatTaxId } from '../utils/billing-format';
import type { BillingDocumentPreviewModel } from '../utils/billing-document-preview';

type BillingDocumentIssueDialogProps = {
  open: boolean;
  preview: BillingDocumentPreviewModel;
  termsDivergence: { authoritativeValue: string; declaredValue: string } | null;
  confirming: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function BillingDocumentIssueDialog({
  open,
  preview,
  termsDivergence,
  confirming,
  onClose,
  onConfirm,
}: BillingDocumentIssueDialogProps) {
  if (!open) {
    return null;
  }

  const blocked = Boolean(termsDivergence);

  return (
    <div className="billing-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="billing-dialog billing-doc-issue-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="billing-doc-issue-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="billing-doc-issue-title">Confirmar emissão da Nota Fatura</h2>
        <p className="billing-doc-issue-dialog__lead">
          O PDF oficial será gerado pelo servidor. Esta confirmação não altera snapshots derivados da medição.
        </p>

        {termsDivergence ? (
          <p className="billing-doc-issue-dialog__block" role="alert">
            Emissão bloqueada: condições comerciais divergentes ({termsDivergence.declaredValue} ≠{' '}
            {termsDivergence.authoritativeValue}).
          </p>
        ) : null}

        <dl className="billing-doc-issue-dialog__summary">
          <div>
            <dt>Número</dt>
            <dd>{preview.documentNumberLabel}</dd>
          </div>
          <div>
            <dt>Cliente</dt>
            <dd>{preview.clientLegalName}</dd>
          </div>
          <div>
            <dt>CNPJ</dt>
            <dd>{formatTaxId(preview.clientTaxId)}</dd>
          </div>
          {preview.purchaseOrderNumber ? (
            <div>
              <dt>PO / RC</dt>
              <dd>{preview.purchaseOrderNumber}</dd>
            </div>
          ) : null}
          <div>
            <dt>Total</dt>
            <dd>{formatMoneyBrl(preview.totalAmount, preview.currencyCode)}</dd>
          </div>
          <div>
            <dt>Vencimento</dt>
            <dd>{preview.dueDate ?? '—'}</dd>
          </div>
          <div>
            <dt>Condição</dt>
            <dd>{preview.paymentTerms}</dd>
          </div>
        </dl>

        <div className="billing-dialog__actions">
          <button type="button" className="billing-button" onClick={onClose} disabled={confirming}>
            Voltar
          </button>
          <button
            type="button"
            className="billing-button billing-button--primary"
            disabled={blocked || confirming}
            onClick={onConfirm}
          >
            {confirming ? 'Emitindo…' : 'Emitir Nota Fatura'}
          </button>
        </div>
      </div>
    </div>
  );
}
