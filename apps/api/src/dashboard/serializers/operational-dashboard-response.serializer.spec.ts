import { describe, expect, it } from 'vitest';
import { buildOperationalDashboardSnapshot } from '../serializers/operational-dashboard-response.serializer';

describe('buildOperationalDashboardSnapshot', () => {
  it('prioritizes attention metrics with actionable counts', () => {
    const snapshot = buildOperationalDashboardSnapshot({
      generatedAt: '2026-08-29T12:00:00.000Z',
      visibility: {
        serviceRequests: true,
        serviceOrders: true,
        measurements: true,
        billing: true,
        documents: true,
        resources: true,
      },
      counts: {
        pendingServiceRequests: 2,
        ordersAwaitingRelease: 0,
        ordersAwaitingConfirmation: 1,
        ordersInProgress: 4,
        overdueServiceOrders: 3,
        resourcesInUse: 5,
        pendingMeasurements: 2,
        pendingBilling: 1,
        divergences: 1,
        pendingDocuments: 0,
      },
    });

    expect(snapshot.attention[0]?.id).toBe('overdue-service-orders');
    expect(snapshot.attention[0]?.count).toBe(3);
    expect(snapshot.attention.some((item) => item.count === 0)).toBe(false);
    expect(snapshot.generatedAt).toBe('2026-08-29T12:00:00.000Z');
  });
});
