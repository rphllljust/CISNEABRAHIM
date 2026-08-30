import { useState } from 'react';
import { formatMoney } from '../../utils/dashboard-formatters';
import type { ExecutiveFinancialAgingBucket } from '../../types/dashboard.types';

type DashboardAgingChartProps = {
  chartId: string;
  title: string;
  description: string;
  summary: string;
  buckets: ExecutiveFinancialAgingBucket[];
};

export function DashboardAgingChart({
  chartId,
  title,
  description,
  summary,
  buckets,
}: DashboardAgingChartProps) {
  const titleId = `${chartId}-title`;
  const descId = `${chartId}-desc`;
  const summaryId = `${chartId}-summary`;
  const [activeBandId, setActiveBandId] = useState<string | null>(null);
  const maxCount = Math.max(1, ...buckets.map((bucket) => bucket.count));
  const activeBucket = buckets.find((bucket) => bucket.bandId === activeBandId) ?? null;

  return (
    <figure className="dashboard-chart" aria-labelledby={titleId} aria-describedby={`${descId} ${summaryId}`}>
      <figcaption>
        <h3 id={titleId}>{title}</h3>
        <p id={descId} className="dashboard-chart__description">
          {description}
        </p>
        <p id={summaryId} className="dashboard-chart__summary">
          {summary}
        </p>
      </figcaption>

      {buckets.length === 0 ? (
        <p className="dashboard-chart__empty">Faixas de aging não disponíveis.</p>
      ) : (
        <>
          <div className="dashboard-chart__plot" role="list">
            {buckets.map((bucket) => {
              const width = `${(bucket.count / maxCount) * 100}%`;
              return (
                <div key={bucket.bandId} className="dashboard-chart__row" role="listitem">
                  <span className="dashboard-chart__row-label">{bucket.label}</span>
                  <div className="dashboard-chart__track">
                    <button
                      type="button"
                      className="dashboard-chart__bar-button dashboard-chart__bar-button--warning"
                      style={{ width }}
                      aria-label={`${bucket.label}: ${bucket.count} documentos`}
                      aria-pressed={activeBandId === bucket.bandId}
                      onClick={() =>
                        setActiveBandId((current) =>
                          current === bucket.bandId ? null : bucket.bandId,
                        )
                      }
                    />
                  </div>
                  <span className="dashboard-chart__row-value">{bucket.count}</span>
                </div>
              );
            })}
          </div>
          <table className="dashboard-chart__table">
            <caption className="sr-only">Dados de {title}</caption>
            <thead>
              <tr>
                <th scope="col">Faixa</th>
                <th scope="col">Quantidade</th>
                <th scope="col">Valor</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((bucket) => (
                <tr key={bucket.bandId}>
                  <th scope="row">{bucket.label}</th>
                  <td>{bucket.count}</td>
                  <td>{formatMoney(bucket.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {activeBucket ? (
        <p className="dashboard-chart__tooltip" role="status">
          {activeBucket.label}: {activeBucket.count} documentos, {formatMoney(activeBucket.totalAmount)}
        </p>
      ) : null}
    </figure>
  );
}
