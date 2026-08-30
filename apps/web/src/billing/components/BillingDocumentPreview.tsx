import type { BillingDocumentPreviewModel } from '../utils/billing-document-preview';
import { formatMoneyBrl, formatQuantity, formatTaxId } from '../utils/billing-format';

type BillingDocumentPreviewProps = {
  model: BillingDocumentPreviewModel;
  printMode?: boolean;
};

export function BillingDocumentPreview({ model, printMode = false }: BillingDocumentPreviewProps) {
  const rootClass = printMode
    ? 'billing-doc-preview billing-doc-preview--print'
    : 'billing-doc-preview';

  return (
    <article className={rootClass} aria-label="Pré-visualização da Nota Fatura">
      <header className="billing-doc-preview__header">
        <p className="billing-doc-preview__category">{model.documentCategory}</p>
        <p className="billing-doc-preview__number">Nº {model.documentNumberLabel}</p>
      </header>

      <div className="billing-doc-preview__grid">
        <section aria-labelledby="preview-emitter-heading">
          <h3 id="preview-emitter-heading">Emitente</h3>
          <p>{model.emitterLegalName}</p>
          <p>CNPJ: {formatTaxId(model.emitterTaxId)}</p>
          <p>{model.emitterAddressLine}</p>
        </section>

        <section aria-labelledby="preview-client-heading">
          <h3 id="preview-client-heading">Cliente</h3>
          <p>{model.clientLegalName}</p>
          <p>CNPJ/CPF: {formatTaxId(model.clientTaxId)}</p>
          <p>{model.billingAddressLine}</p>
        </section>
      </div>

      <dl className="billing-doc-preview__meta">
        <div>
          <dt>Condição de pagamento</dt>
          <dd>{model.paymentTerms}</dd>
        </div>
        <div>
          <dt>Vencimento</dt>
          <dd>{model.dueDate ?? '—'}</dd>
        </div>
        <div>
          <dt>Referência comercial</dt>
          <dd>{model.commercialReferenceLabel}</dd>
        </div>
        {model.purchaseOrderNumber ? (
          <div>
            <dt>PO / RC</dt>
            <dd>{model.purchaseOrderNumber}</dd>
          </div>
        ) : null}
        {model.contractReference ? (
          <div>
            <dt>Contrato</dt>
            <dd>{model.contractReference}</dd>
          </div>
        ) : null}
      </dl>

      <div className="billing-compare billing-compare--desktop">
        <table className="billing-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Descrição</th>
              <th scope="col" className="billing-table__num">
                Qtd
              </th>
              <th scope="col" className="billing-table__num">
                Preço
              </th>
              <th scope="col" className="billing-table__num">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {model.items.map((item) => (
              <tr key={item.id}>
                <td>{item.lineNumber}</td>
                <td>{item.lineLabel}</td>
                <td className="billing-table__num">{formatQuantity(item.quantity, item.unitCode)}</td>
                <td className="billing-table__num">
                  {item.unitPrice ? formatMoneyBrl(item.unitPrice, model.currencyCode) : '—'}
                </td>
                <td className="billing-table__num billing-table__amount">
                  {formatMoneyBrl(item.lineAmount, model.currencyCode)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="billing-doc-preview__footer">
        <p className="billing-doc-preview__total">
          Total: <strong>{formatMoneyBrl(model.totalAmount, model.currencyCode)}</strong>
        </p>
        <p className="billing-doc-preview__disclaimer">{model.fiscalDisclaimer}</p>
      </footer>
    </article>
  );
}
