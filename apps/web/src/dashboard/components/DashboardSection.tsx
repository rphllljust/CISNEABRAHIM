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
    <section aria-labelledby={`${id}-heading`}>
      <header className="mb-4">
        <h2 id={`${id}-heading`} className="text-base font-semibold text-gray-900">
          {title}
        </h2>
        {description ? <p className="mt-0.5 text-sm text-gray-500">{description}</p> : null}
      </header>
      {metrics.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" role="list">
          {metrics.map((metric) => (
            <div key={metric.id} role="listitem">
              <DashboardMetricCard metric={metric} />
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-white p-4 text-sm text-gray-500 shadow-sm ring-1 ring-gray-900/5">
          {emptyMessage}
        </p>
      )}
      {children}
    </section>
  );
}
