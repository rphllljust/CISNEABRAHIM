import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { DashboardMetricCard } from './DashboardMetricCard';

describe('DashboardMetricCard', () => {
  it('renders a semantic link for actionable metrics', () => {
    render(
      <MemoryRouter>
        <DashboardMetricCard
          metric={{
            id: 'pending-service-requests',
            label: 'Solicitações pendentes',
            count: 3,
            severity: 'warning',
            href: '/app/requests',
            ariaLabel: 'Solicitações pendentes: 3 itens',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Solicitações pendentes: 3 itens' })).toHaveAttribute(
      'href',
      '/app/requests',
    );
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders non-link article when href is absent', () => {
    render(
      <MemoryRouter>
        <DashboardMetricCard
          metric={{
            id: 'pending-documents',
            label: 'Documentos pendentes',
            count: 2,
            severity: 'warning',
            href: null,
            ariaLabel: 'Documentos pendentes: 2 itens',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Documentos pendentes: 2 itens')).toBeInTheDocument();
  });
});
