import type { ReactNode } from 'react';
import { DashboardMetricCard } from './DashboardMetricCard';
import type { DashboardMetric } from '../types/dashboard.types';

type DashboardSectionProps = {
  id: string;
  title: string;
  description?: string;
  metrics: DashboardMetric[];
  emptyMessage: string;
  children?: ReactNode;
};

export function DashboardSection({
  id,
  title,
  description,
  metrics,
  emptyMessage,
  children,
}: DashboardSectionProps) {
  return (
    <section className="dashboard-section" aria-labelledby={`${id}-heading`}>
      <header className="dashboard-section__header">
        <h2 id={`${id}-heading`}>{title}</h2>
        {description ? <p className="dashboard-section__description">{description}</p> : null}
      </header>
      {metrics.length > 0 ? (
        <div className="dashboard-grid" role="list">
          {metrics.map((metric) => (
            <div key={metric.id} role="listitem">
              <DashboardMetricCard metric={metric} />
            </div>
          ))}
        </div>
      ) : (
        <p className="dashboard-section__empty">{emptyMessage}</p>
      )}
      {children}
    </section>
  );
}
