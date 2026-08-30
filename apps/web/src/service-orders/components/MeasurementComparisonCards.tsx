import { formatMoneyBrl, formatQuantity } from '../utils/measurement-format';
import type { MeasurementComparisonRow } from '../utils/measurement-variance';
import { MeasurementVarianceBadge } from './MeasurementVarianceBadge';

type MeasurementComparisonCardsProps = {
  rows: MeasurementComparisonRow[];
};

export function MeasurementComparisonCards({ rows }: MeasurementComparisonCardsProps) {
  return (
    <div className="measurement-card-list">
      {rows.map((row) => (
        <article
          key={row.key}
          className={`measurement-card measurement-card--${row.primaryVariance.replace(/_/g, '-')}`}
          aria-labelledby={`${row.key}-title`}
        >
          <header className="measurement-card__header">
            <h3 id={`${row.key}-title`} className="measurement-card__title">
              {row.label}
            </h3>
            <div className="measurement-variance-list">
              {row.variances.map((variance) => (
                <MeasurementVarianceBadge key={`${row.key}-${variance}`} variance={variance} />
              ))}
            </div>
          </header>

          <dl className="measurement-card__grid">
            <div>
              <dt>Origem</dt>
              <dd>
                <code className="measurement-origin">
                  {row.sourceExecutionEntryId ? row.sourceExecutionEntryId.slice(0, 8) : '—'}
                </code>
              </dd>
            </div>
            <div>
              <dt>UoM</dt>
              <dd>{row.unitCode}</dd>
            </div>
            <div>
              <dt>Planejado</dt>
              <dd className="measurement-amount">
                {row.plannedQuantity ? formatQuantity(row.plannedQuantity, row.unitCode) : '—'}
              </dd>
            </div>
            <div>
              <dt>Realizado</dt>
              <dd className="measurement-amount">
                {row.actualQuantity ? formatQuantity(row.actualQuantity, row.unitCode) : '—'}
              </dd>
            </div>
            <div>
              <dt>Medido</dt>
              <dd className="measurement-amount measurement-amount--emphasis">
                {row.measuredQuantity ? formatQuantity(row.measuredQuantity, row.unitCode) : '—'}
              </dd>
            </div>
            <div>
              <dt>Valor</dt>
              <dd className="measurement-amount">{formatMoneyBrl(row.lineAmount)}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}
