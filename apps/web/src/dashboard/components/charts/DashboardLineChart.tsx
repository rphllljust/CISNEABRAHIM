import { useState } from 'react';
import { formatDateLabel } from '../../utils/dashboard-formatters';
import type { ExecutiveTrendPoint } from '../../types/dashboard.types';

type DashboardLineChartProps = {
  chartId: string;
  title: string;
  description: string;
  summary: string;
  points: ExecutiveTrendPoint[];
};

const WIDTH = 640;
const HEIGHT = 220;
const PADDING = { top: 16, right: 16, bottom: 36, left: 40 };

export function DashboardLineChart({
  chartId,
  title,
  description,
  summary,
  points,
}: DashboardLineChartProps) {
  const titleId = `${chartId}-title`;
  const descId = `${chartId}-desc`;
  const summaryId = `${chartId}-summary`;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const maxValue = Math.max(
    1,
    ...points.flatMap((point) => [point.opened, point.completed]),
  );
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const toX = (index: number) =>
    PADDING.left + (points.length <= 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
  const toY = (value: number) => PADDING.top + plotHeight - (value / maxValue) * plotHeight;

  const openedPath = buildPath(points, (point) => point.opened, toX, toY);
  const completedPath = buildPath(points, (point) => point.completed, toX, toY);
  const activePoint = activeIndex !== null ? points[activeIndex] : null;

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
        <p className="dashboard-chart__empty">Sem dados no período.</p>
      ) : (
        <>
          <div className="dashboard-chart__svg-wrap">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="dashboard-chart__svg"
              role="img"
              aria-hidden="true"
            >
              <line
                x1={PADDING.left}
                y1={PADDING.top + plotHeight}
                x2={WIDTH - PADDING.right}
                y2={PADDING.top + plotHeight}
                className="dashboard-chart__axis"
              />
              <path d={openedPath} className="dashboard-chart__line dashboard-chart__line--series-1" fill="none" />
              <path d={completedPath} className="dashboard-chart__line dashboard-chart__line--series-2" fill="none" />
              {points.map((point, index) => (
                <g key={point.date}>
                  <circle
                    cx={toX(index)}
                    cy={toY(point.opened)}
                    r={4}
                    className="dashboard-chart__dot dashboard-chart__dot--series-1"
                  />
                  <circle
                    cx={toX(index)}
                    cy={toY(point.completed)}
                    r={4}
                    className="dashboard-chart__dot dashboard-chart__dot--series-2"
                  />
                  <text
                    x={toX(index)}
                    y={HEIGHT - 8}
                    textAnchor="middle"
                    className="dashboard-chart__tick"
                  >
                    {formatDateLabel(point.date)}
                  </text>
                </g>
              ))}
            </svg>
            <div className="dashboard-chart__focus-layer">
              {points.map((point, index) => (
                <button
                  key={point.date}
                  type="button"
                  className="dashboard-chart__focus-point"
                  style={{
                    left: `${(toX(index) / WIDTH) * 100}%`,
                    top: '50%',
                  }}
                  aria-label={`${formatDateLabel(point.date)}: ${point.opened} abertas, ${point.completed} concluídas`}
                  aria-pressed={activeIndex === index}
                  onClick={() => setActiveIndex((current) => (current === index ? null : index))}
                />
              ))}
            </div>
          </div>
          <ul className="dashboard-chart__legend" aria-hidden="true">
            <li>
              <span className="dashboard-chart__legend-swatch dashboard-chart__legend-swatch--series-1" />
              Abertas
            </li>
            <li>
              <span className="dashboard-chart__legend-swatch dashboard-chart__legend-swatch--series-2" />
              Concluídas
            </li>
          </ul>
          <AccessibleTrendTable points={points} caption={`Dados de ${title}`} />
        </>
      )}

      {activePoint ? (
        <p className="dashboard-chart__tooltip" role="status">
          {formatDateLabel(activePoint.date)}: {activePoint.opened} abertas, {activePoint.completed} concluídas
        </p>
      ) : null}
    </figure>
  );
}

function buildPath(
  points: ExecutiveTrendPoint[],
  pick: (point: ExecutiveTrendPoint) => number,
  toX: (index: number) => number,
  toY: (value: number) => number,
): string {
  return points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command} ${toX(index)} ${toY(pick(point))}`;
    })
    .join(' ');
}

function AccessibleTrendTable({
  points,
  caption,
}: {
  points: ExecutiveTrendPoint[];
  caption: string;
}) {
  return (
    <table className="dashboard-chart__table">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Data</th>
          <th scope="col">Abertas</th>
          <th scope="col">Concluídas</th>
        </tr>
      </thead>
      <tbody>
        {points.map((point) => (
          <tr key={point.date}>
            <th scope="row">{formatDateLabel(point.date)}</th>
            <td>{point.opened}</td>
            <td>{point.completed}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
