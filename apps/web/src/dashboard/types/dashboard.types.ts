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
