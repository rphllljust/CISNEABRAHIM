import { useState } from 'react';
import type { ExecutiveSlaPoint } from '../../types/dashboard.types';

type DashboardSlaChartProps = {
  chartId: string;
  title: string;
  description: string;
  summary: string;
  points: ExecutiveSlaPoint[];
};

export function DashboardSlaChart({
  chartId,
  title,
  description,
  summary,
  points,
}: DashboardSlaChartProps) {
  const titleId = `${chartId}-title`;
  const descId = `${chartId}-desc`;
  const summaryId = `${chartId}-summary`;
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const maxEligible = Math.max(1, ...points.map((point) => point.eligible));
  const activePoint = points.find((point) => point.periodLabel === activeLabel) ?? null;

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

      {points.length === 0 ? (
        <p className="dashboard-chart__empty">Sem conclusões elegíveis no período.</p>
      ) : (
        <>
          <div className="dashboard-chart__plot" role="list">
            {points.map((point) => {
              const onTimeWidth = `${(point.onTime / maxEligible) * 100}%`;
              const overdueWidth = `${(point.overdue / maxEligible) * 100}%`;
              return (
                <div key={point.periodLabel} className="dashboard-chart__row" role="listitem">
                  <span className="dashboard-chart__row-label">{point.periodLabel}</span>
                  <div className="dashboard-chart__track dashboard-chart__track--stacked">
                    <button
                      type="button"
                      className="dashboard-chart__bar-button dashboard-chart__bar-button--positive"
                      style={{ width: onTimeWidth }}
                      aria-label={`${point.periodLabel}: ${point.onTime} no prazo de ${point.eligible} elegíveis`}
                      aria-pressed={activeLabel === point.periodLabel}
                      onClick={() =>
                        setActiveLabel((current) =>
                          current === point.periodLabel ? null : point.periodLabel,
                        )
                      }
                    />
                    <button
                      type="button"
                      className="dashboard-chart__bar-button dashboard-chart__bar-button--critical"
                      style={{ width: overdueWidth }}
                      aria-label={`${point.periodLabel}: ${point.overdue} vencidas de ${point.eligible} elegíveis`}
                      aria-pressed={activeLabel === point.periodLabel}
                      onClick={() =>
                        setActiveLabel((current) =>
                          current === point.periodLabel ? null : point.periodLabel,
                        )
                      }
                    />
                  </div>
                  <span className="dashboard-chart__row-value">{point.eligible}</span>
                </div>
              );
            })}
          </div>
          <ul className="dashboard-chart__legend" aria-hidden="true">
            <li>
              <span className="dashboard-chart__legend-swatch dashboard-chart__legend-swatch--positive" />
              No prazo
            </li>
            <li>
              <span className="dashboard-chart__legend-swatch dashboard-chart__legend-swatch--critical" />
              Vencidas
            </li>
            <li>Denominador = elegíveis com prazo</li>
          </ul>
          <table className="dashboard-chart__table">
            <caption className="sr-only">Dados de {title}</caption>
            <thead>
              <tr>
                <th scope="col">Período</th>
                <th scope="col">No prazo</th>
                <th scope="col">Vencidas</th>
                <th scope="col">Elegíveis</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.periodLabel}>
                  <th scope="row">{point.periodLabel}</th>
                  <td>{point.onTime}</td>
                  <td>{point.overdue}</td>
                  <td>{point.eligible}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {activePoint ? (
        <p className="dashboard-chart__tooltip" role="status">
          {activePoint.periodLabel}: {activePoint.onTime} no prazo, {activePoint.overdue} vencidas (
          {activePoint.eligible} elegíveis)
        </p>
      ) : null}
    </figure>
  );
}
