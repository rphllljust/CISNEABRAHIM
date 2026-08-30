import type { CommercialTermsDivergence } from '../types/billing.types';

type BillingCommercialTermsMismatchPanelProps = {
  divergence: CommercialTermsDivergence;
  onUseAuthoritative?: () => void;
};

export function BillingCommercialTermsMismatchPanel({
  divergence,
  onUseAuthoritative,
}: BillingCommercialTermsMismatchPanelProps) {
  return (
    <section
      className="billing-mismatch"
      role="alert"
      aria-labelledby="billing-mismatch-heading"
    >
      <h2 id="billing-mismatch-heading">Divergência de condições comerciais</h2>
      <p className="billing-mismatch__lead">
        As condições informadas não coincidem com a fonte autoritativa. A preparação foi bloqueada até
        alinhamento administrativo.
      </p>
      <div className="billing-mismatch__compare" aria-label="Comparação de condições comerciais">
        <article className="billing-mismatch__source">
          <h3>Fonte A — {divergence.authoritativeLabel}</h3>
          <p className="billing-mismatch__value">{divergence.authoritativeValue}</p>
        </article>
        <article className="billing-mismatch__source billing-mismatch__source--declared">
          <h3>Fonte B — {divergence.declaredLabel}</h3>
          <p className="billing-mismatch__value">{divergence.declaredValue}</p>
        </article>
      </div>
      {onUseAuthoritative ? (
        <div className="billing-mismatch__actions">
          <button type="button" className="billing-button billing-button--primary" onClick={onUseAuthoritative}>
            Adotar condição da fonte autoritativa
          </button>
          <p className="billing-mismatch__hint">
            Ação administrativa: alinhar a condição informada à fonte A antes de preparar o faturamento.
          </p>
        </div>
      ) : null}
    </section>
  );
}
