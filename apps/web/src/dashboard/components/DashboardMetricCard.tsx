import { Link } from 'react-router-dom';
import type { DashboardMetric, DashboardMetricSeverity } from '../types/dashboard.types';

const SEVERITY_CLASS: Record<DashboardMetricSeverity, string> = {
  neutral: 'dashboard-card--neutral',
  info: 'dashboard-card--info',
  warning: 'dashboard-card--warning',
  critical: 'dashboard-card--critical',
  success: 'dashboard-card--success',
};

type DashboardMetricCardProps = {
  metric: DashboardMetric;
};

export function DashboardMetricCard({ metric }: DashboardMetricCardProps) {
  const className = `dashboard-card ${SEVERITY_CLASS[metric.severity]}`;
  const content = (
    <>
      <p className="dashboard-card__label">{metric.label}</p>
      <p className="dashboard-card__count" aria-hidden="true">
        {metric.count}
      </p>
      <p className="dashboard-card__hint">
        {metric.count === 1 ? 'requer ação' : 'requerem ação'}
      </p>
    </>
  );

  if (metric.href) {
    return (
      <Link className={className} to={metric.href} aria-label={metric.ariaLabel}>
        {content}
      </Link>
    );
  }

  return (
    <article className={className} aria-label={metric.ariaLabel}>
      {content}
    </article>
  );
}
