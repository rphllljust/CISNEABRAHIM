import type { BillingDocumentDetail } from '../types/billing.types';
import { formatDateTimePtBr, formatMoneyBrl } from '../utils/billing-format';

type BillingDocumentIssuedListProps = {
  documents: BillingDocumentDetail[];
  onDownload: (document: BillingDocumentDetail) => void;
  downloadingId: string | null;
};

export function BillingDocumentIssuedList({
  documents,
  onDownload,
  downloadingId,
}: BillingDocumentIssuedListProps) {
  if (documents.length === 0) {
    return <p className="billing-documents__empty">Nenhum documento emitido nesta preparação.</p>;
  }

  return (
    <ul className="billing-doc-issued-list">
      {documents.map((document) => (
        <li key={document.id} className="billing-doc-issued-list__item">
          <div>
            <p className="billing-doc-issued-list__number">{document.documentNumber}</p>
            <p className="billing-doc-issued-list__meta">
              {document.status} · v{document.versionNumber} · {formatDateTimePtBr(document.issuedAt)}
            </p>
            <p className="billing-doc-issued-list__amount">
              {formatMoneyBrl(document.totalAmount, document.currencyCode)}
            </p>
          </div>
          {document.status === 'FINALIZED' ? (
            <button
              type="button"
              className="billing-button"
              disabled={downloadingId === document.id}
              onClick={() => onDownload(document)}
            >
              {downloadingId === document.id ? 'Baixando…' : 'Baixar PDF'}
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
