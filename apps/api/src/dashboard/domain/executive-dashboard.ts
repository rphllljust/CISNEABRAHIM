import type { ProductivitySummary } from '../../analytics/domain/productivity-summary';
import type { DashboardVisibility } from './operational-dashboard';

export type ExecutiveAttentionItem = {
  id: string;
  label: string;
  count: number;
  severity: 'critical' | 'warning' | 'info';
  href: string | null;
  ariaLabel: string;
  maxDelayDays: number | null;
  detail: string | null;
};

export type ExecutiveStatusBarItem = {
  status: string;
  label: string;
  count: number;
};

export type ExecutiveTrendPoint = {
  date: string;
  opened: number;
  completed: number;
};

export type ExecutiveSlaPoint = {
  periodLabel: string;
  onTime: number;
  overdue: number;
  eligible: number;
  onTimeRate: number | null;
};

export type ExecutiveFinancialAgingBucket = {
  bandId: string;
  label: string;
  count: number;
  totalAmount: string;
};

export type ExecutiveDashboardSnapshot = {
  generatedAt: string;
  businessTimezone: string;
  period: {
    preset: string;
    from: string;
    to: string;
  };
  visibility: DashboardVisibility & {
    productivity: boolean;
    financialAging: boolean;
  };
  attention: ExecutiveAttentionItem[];
  charts: {
    serviceOrdersByStatus: {
      title: string;
      description: string;
      items: ExecutiveStatusBarItem[];
      summary: string;
    };
    throughputTrend: {
      title: string;
      description: string;
      points: ExecutiveTrendPoint[];
      summary: string;
    };
    sla: {
      title: string;
      description: string;
      points: ExecutiveSlaPoint[];
      summary: string;
    };
    financialAging: {
      available: boolean;
      title: string;
      description: string;
      buckets: ExecutiveFinancialAgingBucket[];
      summary: string;
    };
  };
  productivity: ProductivitySummary | null;
  shortcuts: Array<{ id: string; label: string; href: string; ariaLabel: string }>;
};

export type ExecutiveChartRawData = {
  statusDistribution: ExecutiveStatusBarItem[];
  throughputTrend: ExecutiveTrendPoint[];
  slaPoints: ExecutiveSlaPoint[];
  financialAgingBuckets: ExecutiveFinancialAgingBucket[];
  financialAgingAvailable: boolean;
  overdueMaxDelayDays: number | null;
  approachingDueCount: number;
  overdueReceivablesCount: number;
  overdueReceivablesAmount: string;
};
