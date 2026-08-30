import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AlertCenterPage } from './pages/AlertCenterPage';

vi.mock('./hooks/useAlerts', () => ({
  useAlertsCenter: () => ({
    state: {
      phase: 'ready',
      items: [
        {
          id: 'alert-1',
          alertType: 'SERVICE_ORDER_OVERDUE',
          severity: 'CRITICAL',
          status: 'ACTIVE',
          title: 'OS vencida',
          message: 'Ordem de serviço vencida há 2 dia(s).',
          entityHref: '/app/service-orders/so-1?filter=overdue',
          unitId: 'unit-a',
          triggeredAt: '2026-08-29T12:00:00.000Z',
          resolvedAt: null,
          lastSeenAt: '2026-08-29T12:00:00.000Z',
        },
      ],
    },
    reload: vi.fn(),
    filters: { status: 'ACTIVE' as const },
    setFilters: vi.fn(),
  }),
  useAlertBadge: () => ({ activeCount: 1, loading: false }),
}));

describe('AlertCenterPage', () => {
  it('renders filterable alert list with entity link', () => {
    render(
      <MemoryRouter>
        <AlertCenterPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /central de alertas/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'OS vencida', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /abrir entidade relacionada/i })).toHaveAttribute(
      'href',
      '/app/service-orders/so-1?filter=overdue',
    );
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
  });
});
