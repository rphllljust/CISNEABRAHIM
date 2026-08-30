import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { DashboardKpiStrip } from './DashboardKpiStrip';
import { DashboardPageHeader } from './DashboardPageHeader';
import { buildDashboardKpis } from '../utils/build-dashboard-kpis';
import { EXECUTIVE_DASHBOARD_SNAPSHOT } from '../../test/dashboard-fetch-mock';

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
] as const;

describe('DashboardPageHeader', () => {
  it('renders integrated breadcrumb, period and refresh control', () => {
    render(
      <DashboardPageHeader
        title="Visão geral"
        periodLabel="2026-08-23 — 2026-08-29"
        period="week"
        periodOptions={PERIOD_OPTIONS}
        onPeriodChange={() => undefined}
        activeFilters={[]}
        generatedAt="2026-08-29T12:00:00.000Z"
        generatedAtFormatted="29/08/2026, 08:00"
        isRefreshing={false}
        onRefresh={() => undefined}
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Visão geral' })).toBeInTheDocument();
    expect(screen.getByText('2026-08-23 — 2026-08-29')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Período' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Atualizar' })).toBeInTheDocument();
    expect(screen.queryByText(/período analisado/i)).not.toBeInTheDocument();
  });
});

describe('DashboardKpiStrip', () => {
  it('derives KPIs from executive snapshot without fabricated values', () => {
    const kpis = buildDashboardKpis(EXECUTIVE_DASHBOARD_SNAPSHOT);
    render(
      <MemoryRouter>
        <DashboardKpiStrip kpis={kpis} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /indicadores principais/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/OS ativas: 6 ordens no escopo/i)).toHaveAttribute(
      'href',
      '/app/service-orders?status=active',
    );
    expect(screen.getByLabelText(/OS concluídas no período: 10/i)).toHaveAttribute(
      'href',
      '/app/service-orders?status=COMPLETED&from=2026-08-23&to=2026-08-29&event=completed',
    );
  });

  it('returns null when no KPIs are available', () => {
    const { container } = render(<DashboardKpiStrip kpis={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('buildDashboardKpis', () => {
  it('does not include financial KPI when aging is unavailable', () => {
    const snapshot = {
      ...EXECUTIVE_DASHBOARD_SNAPSHOT,
      charts: {
        ...EXECUTIVE_DASHBOARD_SNAPSHOT.charts,
        financialAging: {
          ...EXECUTIVE_DASHBOARD_SNAPSHOT.charts.financialAging,
          available: false,
          buckets: [],
        },
      },
    };
    const kpis = buildDashboardKpis(snapshot);
    expect(kpis.some((kpi) => kpi.id === 'overdue-receivables')).toBe(false);
  });
});
