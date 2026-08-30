import { useState } from 'react';
import type { ExecutiveSlaPoint } from '../../types/dashboard.types';

type DashboardSlaChartProps = {
  chartId: string;
  title: string;
  description: string;
  summary: string;
  points: ExecutiveSlaPoint[];
};

const CHART_CARD =
  'm-0 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5';

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
    <figure
      className={CHART_CARD}
      aria-labelledby={titleId}
      aria-describedby={`${descId} ${summaryId}`}
    >
      <figcaption>
        <h3 id={titleId} className="text-sm font-semibold text-gray-900">
          {title}
        </h3>
        <p id={descId} className="mt-1 text-xs leading-relaxed text-gray-500">
          {description}
        </p>
      </figcaption>

      {points.length === 0 ? (
        <p className="mt-4 text-xs text-gray-500">Sem conclusões elegíveis no período.</p>
      ) : (
        <>
          <div className="mt-5 space-y-3.5" role="list">
            {points.map((point) => {
              const onTimeWidth = `${(point.onTime / maxEligible) * 100}%`;
              const overdueWidth = `${(point.overdue / maxEligible) * 100}%`;
              return (
                <div key={point.periodLabel} className="flex items-center gap-3" role="listitem">
                  <span className="w-16 shrink-0 text-xs text-gray-500">{point.periodLabel}</span>
                  <div className="flex h-4 flex-1 overflow-hidden rounded bg-gray-100">
                    <button
                      type="button"
                      className="h-full min-w-0 border-0 bg-emerald-500 p-0"
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
                      className="h-full min-w-0 border-0 bg-red-500 p-0"
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
                  <span className="w-4 text-right text-xs font-semibold text-gray-900 tabular-nums">
                    {point.eligible}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex gap-4" aria-hidden="true">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              No prazo
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Vencidas
            </div>
          </div>

          <p id={summaryId} className="mt-4 border-t border-gray-100 pt-4 text-xs text-gray-500">
            {summary}
          </p>

          <table className="sr-only">
            <caption>Dados de {title}</caption>
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
        <p className="sr-only" role="status">
          {activePoint.periodLabel}: {activePoint.onTime} no prazo, {activePoint.overdue} vencidas (
          {activePoint.eligible} elegíveis)
        </p>
      ) : null}
    </figure>
  );
}
