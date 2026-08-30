import { useId, useState } from 'react';

type BarItem = {
  key: string;
  label: string;
  value: number;
};

type DashboardBarChartProps = {
  chartId: string;
  title: string;
  description: string;
  summary: string;
  items: BarItem[];
};

const SERIES_COLORS = [
  'var(--chart-series-1)',
  'var(--chart-series-2)',
  'var(--chart-series-3)',
  'var(--chart-series-4)',
  'var(--chart-series-5)',
];

export function DashboardBarChart({
  chartId,
  title,
  description,
  summary,
  items,
}: DashboardBarChartProps) {
  const titleId = `${chartId}-title`;
  const descId = `${chartId}-desc`;
  const summaryId = `${chartId}-summary`;
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const maxValue = Math.max(1, ...items.map((item) => item.value));
  const activeItem = items.find((item) => item.key === activeKey) ?? null;

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

      {items.length === 0 ? (
        <p className="dashboard-chart__empty">Sem dados no período.</p>
      ) : (
        <>
          <div className="dashboard-chart__plot" role="list">
            {items.map((item, index) => {
              const width = `${(item.value / maxValue) * 100}%`;
              return (
                <div key={item.key} className="dashboard-chart__row" role="listitem">
                  <span className="dashboard-chart__row-label">{item.label}</span>
                  <div className="dashboard-chart__track">
                    <button
                      type="button"
                      className="dashboard-chart__bar-button"
                      style={{
                        width,
                        backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length],
                      }}
                      aria-label={`${item.label}: ${item.value}`}
                      aria-pressed={activeKey === item.key}
                      onClick={() => setActiveKey((current) => (current === item.key ? null : item.key))}
                      onFocus={() => setActiveKey(item.key)}
                    />
                  </div>
                  <span className="dashboard-chart__row-value">{item.value}</span>
                </div>
              );
            })}
          </div>

          <AccessibleDataTable items={items} caption={`Dados de ${title}`} />
        </>
      )}

      {activeItem ? (
        <p className="dashboard-chart__tooltip" role="status">
          {activeItem.label}: {activeItem.value}
        </p>
      ) : null}
    </figure>
  );
}

function AccessibleDataTable({ items, caption }: { items: BarItem[]; caption: string }) {
  const tableId = useId();
  return (
    <table className="dashboard-chart__table" id={tableId}>
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Categoria</th>
          <th scope="col">Quantidade</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.key}>
            <th scope="row">{item.label}</th>
            <td>{item.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
