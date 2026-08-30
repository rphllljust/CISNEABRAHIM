import type { DashboardMetric, DashboardMetricSeverity } from '../types/dashboard.types';
import { KpiCard, type KpiCardTone } from '../../ui/KpiCard';

const SEVERITY_TONE: Record<DashboardMetricSeverity, KpiCardTone> = {
  neutral: 'default',
  info: 'primary',
  warning: 'warning',
  critical: 'critical',
  success: 'success',
};

type DashboardMetricCardProps = {
  metric: DashboardMetric;
};

export function DashboardMetricCard({ metric }: DashboardMetricCardProps) {
  return (
    <KpiCard
      label={metric.label}
      value={metric.count}
      ariaLabel={metric.ariaLabel}
      href={metric.href}
      tone={SEVERITY_TONE[metric.severity]}
      footer={
        <p className="mt-1 text-xs text-slate-400">
          {metric.count === 1 ? 'requer ação' : 'requerem ação'}
        </p>
      }
    />
  );
}
