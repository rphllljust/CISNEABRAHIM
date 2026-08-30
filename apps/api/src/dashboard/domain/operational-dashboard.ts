export const DASHBOARD_METRIC_SEVERITIES = {
  Neutral: 'neutral',
  Info: 'info',
  Warning: 'warning',
  Critical: 'critical',
  Success: 'success',
} as const;

export type DashboardMetricSeverity =
  (typeof DASHBOARD_METRIC_SEVERITIES)[keyof typeof DASHBOARD_METRIC_SEVERITIES];

export const DASHBOARD_SECTIONS = {
  Attention: 'attention',
  Operation: 'operation',
  Deadlines: 'deadlines',
  Finance: 'finance',
  Shortcuts: 'shortcuts',
} as const;

export type DashboardSectionId = (typeof DASHBOARD_SECTIONS)[keyof typeof DASHBOARD_SECTIONS];

export const DASHBOARD_METRIC_IDS = {
  PendingServiceRequests: 'pending-service-requests',
  OrdersAwaitingRelease: 'orders-awaiting-release',
  OrdersAwaitingConfirmation: 'orders-awaiting-confirmation',
  OrdersInProgress: 'orders-in-progress',
  OverdueServiceOrders: 'overdue-service-orders',
  ResourcesInUse: 'resources-in-use',
  PendingMeasurements: 'pending-measurements',
  PendingBilling: 'pending-billing',
  Divergences: 'divergences',
  PendingDocuments: 'pending-documents',
} as const;

export type DashboardMetricId = (typeof DASHBOARD_METRIC_IDS)[keyof typeof DASHBOARD_METRIC_IDS];

export type DashboardVisibility = {
  serviceRequests: boolean;
  serviceOrders: boolean;
  measurements: boolean;
  billing: boolean;
  documents: boolean;
  resources: boolean;
};

export type DashboardMetricSnapshot = {
  id: DashboardMetricId;
  label: string;
  count: number;
  severity: DashboardMetricSeverity;
  href: string | null;
  ariaLabel: string;
};

export type DashboardShortcutSnapshot = {
  id: string;
  label: string;
  href: string;
  ariaLabel: string;
};

export type OperationalDashboardSnapshot = {
  generatedAt: string;
  visibility: DashboardVisibility;
  attention: DashboardMetricSnapshot[];
  operation: DashboardMetricSnapshot[];
  deadlines: DashboardMetricSnapshot[];
  finance: DashboardMetricSnapshot[];
  shortcuts: DashboardShortcutSnapshot[];
};
