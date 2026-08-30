import type { OperationalDashboardSnapshot } from '../types/dashboard.types';

const DASHBOARD_SNAPSHOT: OperationalDashboardSnapshot = {
  generatedAt: '2026-08-29T12:00:00.000Z',
  visibility: {
    serviceRequests: true,
    serviceOrders: true,
    measurements: true,
    billing: true,
    documents: false,
    resources: true,
  },
  attention: [
    {
      id: 'overdue-service-orders',
      label: 'OS atrasadas',
      count: 3,
      severity: 'critical',
      href: '/app/service-orders',
      ariaLabel: 'OS atrasadas: 3 itens',
    },
    {
      id: 'pending-measurements',
      label: 'Medições aguardando aprovação',
      count: 2,
      severity: 'warning',
      href: '/app/billing',
      ariaLabel: 'Medições aguardando aprovação: 2 itens',
    },
  ],
  operation: [
    {
      id: 'orders-in-progress',
      label: 'OS em andamento',
      count: 4,
      severity: 'neutral',
      href: '/app/service-orders',
      ariaLabel: 'OS em andamento: 4 itens',
    },
  ],
  deadlines: [],
  finance: [
    {
      id: 'pending-billing',
      label: 'Faturamentos pendentes',
      count: 1,
      severity: 'warning',
      href: '/app/billing',
      ariaLabel: 'Faturamentos pendentes: 1 item',
    },
  ],
  shortcuts: [
    {
      id: 'shortcut-requests',
      label: 'Solicitações',
      href: '/app/requests',
      ariaLabel: 'Ir para solicitações de serviço',
    },
  ],
};

export function createDashboardFetchMock() {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method ?? 'GET';

    if (url.includes('/api/v1/auth/login') && method === 'POST') {
      return new Response(
        JSON.stringify({
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          tokenType: 'Bearer',
          expiresIn: 900,
          session: { id: 'session-dashboard', expiresAt: new Date().toISOString(), status: 'active' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.includes('/api/v1/auth/session') && method === 'GET') {
      return new Response(
        JSON.stringify({
          identityId: '11111111-1111-4111-8111-111111111111',
          session: { id: 'session-dashboard', expiresAt: new Date().toISOString(), status: 'active' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (url.includes('/api/v1/dashboard/operational') && method === 'GET') {
      return new Response(JSON.stringify(DASHBOARD_SNAPSHOT), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.includes('/api/v1/requests/service-requests') && method === 'GET') {
      return new Response(JSON.stringify({ items: [], total: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ code: 'NOT_FOUND' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}
