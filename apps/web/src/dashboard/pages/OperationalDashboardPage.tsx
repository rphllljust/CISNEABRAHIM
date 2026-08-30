import { Link } from 'react-router-dom';
import { AttentionBlock } from '../components/AttentionBlock';
import { DashboardAgingChart } from '../components/charts/DashboardAgingChart';
import { DashboardBarChart } from '../components/charts/DashboardBarChart';
import { DashboardLineChart } from '../components/charts/DashboardLineChart';
import { DashboardSlaChart } from '../components/charts/DashboardSlaChart';
import { DashboardFilters } from '../components/DashboardFilters';
import { OperationalDashboardSkeleton } from '../components/OperationalDashboardSkeleton';
import { ProductivityPanel } from '../components/ProductivityPanel';
import { useExecutiveDashboard } from '../hooks/useExecutiveDashboard';
import '../dashboard.css';

function formatGeneratedAt(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatPeriodLabel(from: string, to: string): string {
  return `${from} — ${to}`;
}

export function OperationalDashboardPage() {
  const { state, reload, filters, setFilters, periodOptions } = useExecutiveDashboard();

  if (state.phase === 'loading') {
    return (
      <main id="main-content" className="dashboard-page">
        <div className="dashboard-page__header">
          <p className="dashboard-page__eyebrow">Operação</p>
          <h1>Painel operacional</h1>
        </div>
        <OperationalDashboardSkeleton />
      </main>
    );
  }

  if (state.phase === 'denied') {
    return (
      <main id="main-content" className="dashboard-page">
        <h1>Painel operacional</h1>
        <p role="alert">Você não tem permissão para visualizar o painel operacional.</p>
        <Link to="/app/requests">Ir para solicitações</Link>
      </main>
    );
  }

  const snapshot = state.phase === 'ready' ? state.snapshot : state.partial;

  return (
    <main id="main-content" className="dashboard-page">
      <div className="dashboard-page__header">
        <p className="dashboard-page__eyebrow">Operação</p>
        <h1>Painel operacional</h1>
        <p className="dashboard-page__lead">
          Central de decisão operacional — alertas primeiro, análise em seguida.
        </p>
        {snapshot ? (
          <p className="dashboard-page__meta">
            Última atualização: {formatGeneratedAt(snapshot.generatedAt)} (atualização automática a cada
            60s)
          </p>
        ) : null}
      </div>

      {state.phase === 'error' ? (
        <div className="dashboard-alert" role="alert">
          {state.message}
          <button type="button" onClick={() => void reload()} style={{ marginLeft: '0.75rem' }}>
            Tentar novamente
          </button>
        </div>
      ) : null}

      {snapshot ? (
        <>
          <DashboardFilters
            period={filters.period}
            periodOptions={periodOptions}
            onPeriodChange={(period) => setFilters({ period })}
            periodLabel={formatPeriodLabel(snapshot.period.from, snapshot.period.to)}
          />

          <AttentionBlock items={snapshot.attention} />

          {snapshot.visibility.serviceOrders ? (
            <section className="dashboard-section" aria-labelledby="analytics-heading">
              <header className="dashboard-section__header">
                <h2 id="analytics-heading">Análise operacional</h2>
                <p className="dashboard-section__description">
                  Gráficos refletem o período selecionado e o escopo autorizado.
                </p>
              </header>
              <div className="dashboard-analytics">
                <DashboardBarChart
                  chartId="service-orders-by-status"
                  title={snapshot.charts.serviceOrdersByStatus.title}
                  description={snapshot.charts.serviceOrdersByStatus.description}
                  summary={snapshot.charts.serviceOrdersByStatus.summary}
                  items={snapshot.charts.serviceOrdersByStatus.items.map((item) => ({
                    key: item.status,
                    label: item.label,
                    value: item.count,
                  }))}
                />
                <DashboardLineChart
                  chartId="throughput-trend"
                  title={snapshot.charts.throughputTrend.title}
                  description={snapshot.charts.throughputTrend.description}
                  summary={snapshot.charts.throughputTrend.summary}
                  points={snapshot.charts.throughputTrend.points}
                />
                <DashboardSlaChart
                  chartId="sla-chart"
                  title={snapshot.charts.sla.title}
                  description={snapshot.charts.sla.description}
                  summary={snapshot.charts.sla.summary}
                  points={snapshot.charts.sla.points}
                />
              </div>
            </section>
          ) : null}

          {snapshot.visibility.productivity && snapshot.productivity ? (
            <ProductivityPanel productivity={snapshot.productivity} />
          ) : null}

          {snapshot.visibility.financialAging && snapshot.charts.financialAging.available ? (
            <section className="dashboard-section" aria-labelledby="finance-heading">
              <DashboardAgingChart
                chartId="financial-aging"
                title={snapshot.charts.financialAging.title}
                description={snapshot.charts.financialAging.description}
                summary={snapshot.charts.financialAging.summary}
                buckets={snapshot.charts.financialAging.buckets}
              />
            </section>
          ) : null}

          {snapshot.shortcuts.length > 0 ? (
            <section className="dashboard-section" aria-labelledby="shortcuts-heading">
              <header className="dashboard-section__header">
                <h2 id="shortcuts-heading">Atalhos</h2>
              </header>
              <nav className="dashboard-shortcuts" aria-label="Atalhos operacionais">
                {snapshot.shortcuts.map((shortcut) => (
                  <Link
                    key={shortcut.id}
                    className="dashboard-shortcuts__link"
                    to={shortcut.href}
                    aria-label={shortcut.ariaLabel}
                  >
                    {shortcut.label}
                  </Link>
                ))}
              </nav>
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
