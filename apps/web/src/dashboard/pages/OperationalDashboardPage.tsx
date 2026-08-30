import { Link } from 'react-router-dom';
import { DashboardSection } from '../components/DashboardSection';
import { OperationalDashboardSkeleton } from '../components/OperationalDashboardSkeleton';
import { useOperationalDashboard } from '../hooks/useOperationalDashboard';
import '../dashboard.css';

function formatGeneratedAt(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function OperationalDashboardPage() {
  const { state, reload } = useOperationalDashboard();

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
          Priorize pendências que exigem decisão antes de métricas secundárias.
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
          <DashboardSection
            id="attention"
            title="Atenção necessária"
            description="Itens que bloqueiam ou atrasam a operação."
            metrics={snapshot.attention}
            emptyMessage="Nenhuma pendência crítica no momento."
          />

          <DashboardSection
            id="operation"
            title="Operação atual"
            description="Fluxo em andamento e recursos alocados."
            metrics={snapshot.operation}
            emptyMessage="Nenhuma OS ou recurso em destaque."
          />

          <DashboardSection
            id="finance"
            title="Financeiro permitido"
            description="Pendências visíveis apenas com permissão financeira."
            metrics={snapshot.finance}
            emptyMessage="Sem pendências financeiras no escopo atual."
          />

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
