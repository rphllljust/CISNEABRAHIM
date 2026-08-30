import { describe, expect, it } from 'vitest';
import { emptyProductivityRawAggregates } from '../../analytics/domain/productivity-summary';
import { buildExecutiveDashboardSnapshot } from './executive-dashboard-response.serializer';

describe('buildExecutiveDashboardSnapshot', () => {
  it('highlights overdue OS with max delay and filtered action link', () => {
    const snapshot = buildExecutiveDashboardSnapshot({
      generatedAt: '2026-08-29T12:00:00.000Z',
      businessTimezone: 'America/Porto_Velho',
      period: { preset: 'week', from: '2026-08-23', to: '2026-08-29' },
      visibility: {
        serviceRequests: true,
        serviceOrders: true,
        measurements: true,
        billing: true,
        documents: false,
        resources: true,
        productivity: true,
        financialAging: true,
      },
      operationalCounts: {
        pendingServiceRequests: 0,
        ordersAwaitingRelease: 0,
        ordersAwaitingConfirmation: 0,
        ordersInProgress: 2,
        overdueServiceOrders: 4,
        resourcesInUse: 1,
        pendingMeasurements: 3,
        pendingBilling: 0,
        divergences: 2,
        pendingDocuments: 0,
      },
      chartData: {
        statusDistribution: [
          { status: 'IN_EXECUTION', label: 'Em execução', count: 2 },
          { status: 'RELEASED', label: 'Liberada', count: 1 },
        ],
        throughputTrend: [
          { date: '2026-08-28', opened: 2, completed: 1 },
          { date: '2026-08-29', opened: 1, completed: 3 },
        ],
        slaPoints: [
          { periodLabel: '2026-S35', onTime: 2, overdue: 1, eligible: 3, onTimeRate: 2 / 3 },
        ],
        financialAgingBuckets: [],
        financialAgingAvailable: false,
        overdueMaxDelayDays: 12,
        approachingDueCount: 5,
        overdueReceivablesCount: 1,
        overdueReceivablesAmount: '1500.00',
      },
      productivityRaw: {
        ...emptyProductivityRawAggregates(),
        completed: 5,
        onTimeNumerator: 4,
        onTimeDenominator: 5,
      },
    });

    const overdue = snapshot.attention.find((item) => item.id === 'overdue-service-orders');
    expect(overdue).toMatchObject({
      label: 'OS vencidas',
      count: 4,
      severity: 'critical',
      href: '/app/service-orders?filter=overdue',
      maxDelayDays: 12,
      detail: 'Maior atraso: 12 dia(s)',
    });
    expect(snapshot.charts.serviceOrdersByStatus.summary).toContain('3 ordens');
    expect(snapshot.charts.sla.summary).toContain('2 de 3');
    expect(snapshot.productivity?.completed).toBe(5);
  });

  it('returns empty attention when no overdue items exist', () => {
    const snapshot = buildExecutiveDashboardSnapshot({
      generatedAt: '2026-08-29T12:00:00.000Z',
      businessTimezone: 'America/Porto_Velho',
      period: { preset: 'week', from: '2026-08-23', to: '2026-08-29' },
      visibility: {
        serviceRequests: true,
        serviceOrders: true,
        measurements: false,
        billing: false,
        documents: false,
        resources: false,
        productivity: true,
        financialAging: false,
      },
      operationalCounts: {
        pendingServiceRequests: 0,
        ordersAwaitingRelease: 0,
        ordersAwaitingConfirmation: 0,
        ordersInProgress: 0,
        overdueServiceOrders: 0,
        resourcesInUse: 0,
        pendingMeasurements: 0,
        pendingBilling: 0,
        divergences: 0,
        pendingDocuments: 0,
      },
      chartData: {
        statusDistribution: [],
        throughputTrend: [],
        slaPoints: [],
        financialAgingBuckets: [],
        financialAgingAvailable: false,
        overdueMaxDelayDays: null,
        approachingDueCount: 0,
        overdueReceivablesCount: 0,
        overdueReceivablesAmount: '0',
      },
      productivityRaw: emptyProductivityRawAggregates(),
    });

    expect(snapshot.attention).toHaveLength(0);
    expect(snapshot.charts.serviceOrdersByStatus.summary).toContain('Nenhuma');
  });
});
