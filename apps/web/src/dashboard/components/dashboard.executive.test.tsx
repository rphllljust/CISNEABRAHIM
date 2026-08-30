import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AttentionBlock } from './AttentionBlock';
import { DashboardBarChart } from './charts/DashboardBarChart';
import { DashboardAgingChart } from './charts/DashboardAgingChart';
import { ProductivityPanel } from './ProductivityPanel';

describe('AttentionBlock', () => {
  it('renders overdue card with max delay and filtered link', () => {
    render(
      <MemoryRouter>
        <AttentionBlock
          items={[
            {
              id: 'overdue-service-orders',
              label: 'OS vencidas',
              count: 3,
              severity: 'critical',
              href: '/app/service-orders?filter=overdue',
              ariaLabel: 'OS vencidas: 3 itens. Maior atraso 8 dias.',
              maxDelayDays: 8,
              detail: 'Maior atraso: 8 dia(s)',
            },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /OS vencidas: 3 itens/i })).toHaveAttribute(
      'href',
      '/app/service-orders?filter=overdue',
    );
    expect(screen.getByText('Maior atraso: 8 dia(s)')).toBeInTheDocument();
    expect(screen.getByText('3')).toHaveClass('dashboard-attention__count--critical');
  });

  it('shows empty state when there are zero attention items', () => {
    render(
      <MemoryRouter>
        <AttentionBlock items={[]} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/nenhuma pendência crítica/i)).toBeInTheDocument();
  });
});

describe('DashboardBarChart', () => {
  it('exposes textual summary and keyboard-focusable bars', () => {
    render(
      <DashboardBarChart
        chartId="status-chart"
        title="OS por status"
        description="Distribuição por status"
        summary="2 ordens ativas"
        items={[
          { key: 'IN_EXECUTION', label: 'Em execução', value: 2 },
          { key: 'RELEASED', label: 'Liberada', value: 1 },
        ]}
      />,
    );

    expect(screen.getByText('2 ordens ativas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Em execução: 2/i })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Em execução' })).toBeInTheDocument();
  });
});

describe('ProductivityPanel', () => {
  it('renders productivity metrics without composite score', () => {
    render(
      <ProductivityPanel
        productivity={{
          completed: 10,
          onTimeRate: { value: 0.8, numerator: 8, denominator: 10, available: true },
          averageCycleTime: { valueHours: 24, sampleSize: 10, available: true },
          reworkRate: {
            value: 0.1,
            numerator: 1,
            denominator: 10,
            available: true,
            concept: 'measurement_rejection_rate',
          },
          utilization: {
            value: 0.5,
            numerator: 5,
            denominator: 10,
            available: true,
            concept: 'allocated_window_over_planned_window',
          },
          evidenceCompleteness: { value: 0.9, numerator: 9, denominator: 10, available: true },
          measurementAcceptance: { value: 0.85, numerator: 17, denominator: 20, available: true },
        }}
      />,
    );

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('80,00%')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /produtividade/i })).toBeInTheDocument();
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
  });
});

describe('DashboardAgingChart', () => {
  it('renders aging buckets with count and amount', async () => {
    const user = userEvent.setup();
    render(
      <DashboardAgingChart
        chartId="aging-chart"
        title="Aging financeiro"
        description="Recebíveis vencidos"
        summary="3 recebíveis vencidos"
        buckets={[
          { bandId: '0-7', label: '0–7 dias', count: 2, totalAmount: '1000.00' },
          { bandId: '8-15', label: '8–15 dias', count: 1, totalAmount: '500.00' },
        ]}
      />,
    );

    const bar = screen.getByRole('button', { name: /0–7 dias: 2 documentos/i });
    await user.click(bar);
    expect(screen.getByRole('status')).toHaveTextContent('R$');
  });
});
