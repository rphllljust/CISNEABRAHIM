import { formatMoneyBrl } from '../utils/measurement-format';
import { countVariances } from '../utils/measurement-comparison';
import type { MeasurementComparisonRow } from '../utils/measurement-variance';
import { VARIANCE_LABELS, type VarianceKind } from '../utils/measurement-variance';

type MeasurementSummaryPanelProps = {
  rows: MeasurementComparisonRow[];
  itemCount: number;
  totalAmount: string;
};

export function MeasurementSummaryPanel({ rows, itemCount, totalAmount }: MeasurementSummaryPanelProps) {
  const varianceCounts = countVariances(rows);

  return (
    <section className="measurement-summary" aria-labelledby="measurement-summary-title">
      <h2 id="measurement-summary-title">Resumo da conferência</h2>
      <div className="measurement-summary__cards">
        <article className="measurement-summary-card">
          <p className="measurement-summary-card__label">Itens</p>
          <p className="measurement-summary-card__value measurement-amount">{itemCount}</p>
        </article>
        <article className="measurement-summary-card">
          <p className="measurement-summary-card__label">Valor medido</p>
          <p className="measurement-summary-card__value measurement-amount">
            {formatMoneyBrl(totalAmount)}
          </p>
        </article>
        <article className="measurement-summary-card">
          <p className="measurement-summary-card__label">Divergências</p>
          <p className="measurement-summary-card__value measurement-amount">
            {Object.values(varianceCounts).reduce((sum, count) => sum + count, 0)}
          </p>
        </article>
      </div>

      {Object.keys(varianceCounts).length > 0 ? (
        <ul className="measurement-summary__variances">
          {(Object.entries(varianceCounts) as Array<[VarianceKind, number]>).map(([kind, count]) => (
            <li key={kind}>
              <span className={`measurement-variance measurement-variance--${kind.replace(/_/g, '-')}`}>
                {VARIANCE_LABELS[kind]}
              </span>
              <span className="measurement-amount">{count}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="measurement-hint">Nenhuma divergência identificada nos itens atuais.</p>
      )}
    </section>
  );
}
