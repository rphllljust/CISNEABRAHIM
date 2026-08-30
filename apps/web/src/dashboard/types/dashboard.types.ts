export type DashboardMetricSeverity = 'neutral' | 'info' | 'warning' | 'critical' | 'success';

export type DashboardMetric = {
  id: string;
  label: string;
  count: number;
  severity: DashboardMetricSeverity;
  href: string | null;
  ariaLabel: string;
};

export type DashboardShortcut = {
  id: string;
  label: string;
  href: string;
  ariaLabel: string;
};

export type DashboardVisibility = {
  serviceRequests: boolean;
  serviceOrders: boolean;
  measurements: boolean;
  billing: boolean;
  documents: boolean;
  resources: boolean;
};

export type OperationalDashboardSnapshot = {
  generatedAt: string;
  visibility: DashboardVisibility;
  attention: DashboardMetric[];
  operation: DashboardMetric[];
  deadlines: DashboardMetric[];
  finance: DashboardMetric[];
  shortcuts: DashboardShortcut[];
};

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

export type RateMetric = {
  value: number | null;
  numerator: number;
  denominator: number;
  available: boolean;
};

export type DurationMetric = {
  valueHours: number | null;
  sampleSize: number;
  available: boolean;
};

export type ProductivitySummary = {
  completed: number;
  onTimeRate: RateMetric;
  averageCycleTime: DurationMetric;
  reworkRate: RateMetric & { concept: string | null };
  utilization: RateMetric & { concept: string | null };
  evidenceCompleteness: RateMetric;
  measurementAcceptance: RateMetric;
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
  shortcuts: DashboardShortcut[];
};

export type ExecutiveDashboardFilters = {
  period: string;
  unitId?: string;
  from?: string;
  to?: string;
};

export const DASHBOARD_ERROR_CODES = {
  ACCESS_DENIED: 'DASHBOARD_ACCESS_DENIED',
} as const;

export type DashboardErrorCode =
  (typeof DASHBOARD_ERROR_CODES)[keyof typeof DASHBOARD_ERROR_CODES];

export type DashboardApiErrorKind = 'denied' | 'network' | 'unknown';

export class DashboardApiError extends Error {
  readonly status: number;
  readonly code?: DashboardErrorCode;
  readonly kind: DashboardApiErrorKind;

  constructor(status: number, code: DashboardErrorCode | undefined, kind: DashboardApiErrorKind) {
    super(code ?? `DASHBOARD_API_ERROR_${status}`);
    this.name = 'DashboardApiError';
    this.status = status;
    this.code = code;
    this.kind = kind;
  }
}
