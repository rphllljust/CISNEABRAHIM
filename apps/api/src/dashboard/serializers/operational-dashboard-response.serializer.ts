import {
  DASHBOARD_METRIC_IDS,
  DASHBOARD_METRIC_SEVERITIES,
  type DashboardMetricSnapshot,
  type DashboardShortcutSnapshot,
  type DashboardVisibility,
  type OperationalDashboardSnapshot,
} from '../domain/operational-dashboard';
import type { OperationalDashboardCounts } from '../repositories/operational-dashboard.repository';

function metric(
  id: DashboardMetricSnapshot['id'],
  label: string,
  count: number,
  severity: DashboardMetricSnapshot['severity'],
  href: string | null,
): DashboardMetricSnapshot {
  const actionLabel = count === 1 ? '1 item' : `${count} itens`;
  return {
    id,
    label,
    count,
    severity,
    href,
    ariaLabel: `${label}: ${actionLabel}`,
  };
}

function sortByUrgency(items: DashboardMetricSnapshot[]): DashboardMetricSnapshot[] {
  const severityRank = {
    critical: 0,
    warning: 1,
    info: 2,
    neutral: 3,
    success: 4,
  } as const;
  return [...items]
    .filter((item) => item.count > 0)
    .sort((left, right) => {
      const severityDelta = severityRank[left.severity] - severityRank[right.severity];
      if (severityDelta !== 0) {
        return severityDelta;
      }
      return right.count - left.count;
    });
}

export function buildOperationalDashboardSnapshot(input: {
  generatedAt: string;
  visibility: DashboardVisibility;
  counts: OperationalDashboardCounts;
}): OperationalDashboardSnapshot {
  const { generatedAt, visibility, counts } = input;

  const attention = sortByUrgency([
    metric(
      DASHBOARD_METRIC_IDS.OverdueServiceOrders,
      'OS atrasadas',
      counts.overdueServiceOrders,
      DASHBOARD_METRIC_SEVERITIES.Critical,
      visibility.serviceOrders ? '/app/service-orders' : null,
    ),
    metric(
      DASHBOARD_METRIC_IDS.Divergences,
      'Divergências',
      counts.divergences,
      DASHBOARD_METRIC_SEVERITIES.Critical,
      visibility.billing ? '/app/billing' : null,
    ),
    metric(
      DASHBOARD_METRIC_IDS.PendingServiceRequests,
      'Solicitações pendentes',
      counts.pendingServiceRequests,
      DASHBOARD_METRIC_SEVERITIES.Warning,
      visibility.serviceRequests ? '/app/requests' : null,
    ),
    metric(
      DASHBOARD_METRIC_IDS.PendingMeasurements,
      'Medições aguardando aprovação',
      counts.pendingMeasurements,
      DASHBOARD_METRIC_SEVERITIES.Warning,
      visibility.measurements ? '/app/billing' : null,
    ),
    metric(
      DASHBOARD_METRIC_IDS.PendingBilling,
      'Faturamentos pendentes',
      counts.pendingBilling,
      DASHBOARD_METRIC_SEVERITIES.Warning,
      visibility.billing ? '/app/billing' : null,
    ),
    metric(
      DASHBOARD_METRIC_IDS.PendingDocuments,
      'Documentos pendentes',
      counts.pendingDocuments,
      DASHBOARD_METRIC_SEVERITIES.Warning,
      null,
    ),
  ]);

  const operation = sortByUrgency([
    metric(
      DASHBOARD_METRIC_IDS.OrdersAwaitingRelease,
      'OS aguardando liberação',
      counts.ordersAwaitingRelease,
      DASHBOARD_METRIC_SEVERITIES.Info,
      visibility.serviceOrders ? '/app/service-orders' : null,
    ),
    metric(
      DASHBOARD_METRIC_IDS.OrdersAwaitingConfirmation,
      'OS aguardando confirmação',
      counts.ordersAwaitingConfirmation,
      DASHBOARD_METRIC_SEVERITIES.Info,
      visibility.serviceOrders ? '/app/service-orders' : null,
    ),
    metric(
      DASHBOARD_METRIC_IDS.OrdersInProgress,
      'OS em andamento',
      counts.ordersInProgress,
      DASHBOARD_METRIC_SEVERITIES.Neutral,
      visibility.serviceOrders ? '/app/service-orders' : null,
    ),
    metric(
      DASHBOARD_METRIC_IDS.ResourcesInUse,
      'Recursos em uso',
      counts.resourcesInUse,
      DASHBOARD_METRIC_SEVERITIES.Neutral,
      visibility.resources ? '/app/assets' : null,
    ),
  ]);

  const shortcuts: DashboardShortcutSnapshot[] = [];
  if (visibility.serviceRequests) {
    shortcuts.push({
      id: 'shortcut-requests',
      label: 'Solicitações',
      href: '/app/requests',
      ariaLabel: 'Ir para solicitações de serviço',
    });
  }
  if (visibility.serviceOrders) {
    shortcuts.push({
      id: 'shortcut-service-orders',
      label: 'Ordens de serviço',
      href: '/app/service-orders',
      ariaLabel: 'Ir para ordens de serviço',
    });
  }
  if (visibility.billing) {
    shortcuts.push({
      id: 'shortcut-billing',
      label: 'Faturamento',
      href: '/app/billing',
      ariaLabel: 'Ir para faturamento',
    });
  }

  return {
    generatedAt,
    visibility,
    attention,
    operation,
    deadlines: [],
    finance: attention.filter((item) =>
      item.id === DASHBOARD_METRIC_IDS.PendingBilling || item.id === DASHBOARD_METRIC_IDS.Divergences,
    ),
    shortcuts,
  };
}
