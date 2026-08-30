import { Link } from 'react-router-dom';
import { useAlertsCenter } from '../hooks/useAlerts';
import { BUSINESS_ALERT_TYPES } from '../types/alerts.types';
import '../alerts.css';

function formatWhen(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function AlertCenterPage() {
  const { state, reload, filters, setFilters } = useAlertsCenter();

  if (state.phase === 'loading') {
    return (
      <main id="main-content" className="alerts-page">
        <h1>Central de alertas</h1>
        <p>Carregando alertas operacionais…</p>
      </main>
    );
  }

  if (state.phase === 'denied') {
    return (
      <main id="main-content" className="alerts-page">
        <h1>Central de alertas</h1>
        <p role="alert">Você não tem permissão para visualizar alertas operacionais.</p>
      </main>
    );
  }

  const items = state.phase === 'ready' ? state.items : (state.partial ?? []);

  return (
    <main id="main-content" className="alerts-page">
      <div className="alerts-page__header">
        <h1>Central de alertas</h1>
        <p className="alerts-page__lead">
          Alertas persistentes derivados das políticas operacionais — não substituem ações no fluxo.
        </p>
      </div>

      {state.phase === 'error' ? (
        <div className="alerts-page__error" role="alert">
          {state.message}
          <button type="button" onClick={() => void reload()} style={{ marginLeft: '0.75rem' }}>
            Tentar novamente
          </button>
        </div>
      ) : null}

      <section className="alerts-filters" aria-label="Filtros de alertas">
        <label htmlFor="alert-status">Status</label>
        <select
          id="alert-status"
          value={filters.status ?? 'ACTIVE'}
          onChange={(event) =>
            setFilters({ status: event.target.value as 'ACTIVE' | 'RESOLVED' })
          }
        >
          <option value="ACTIVE">Ativos</option>
          <option value="RESOLVED">Resolvidos</option>
        </select>

        <label htmlFor="alert-type">Tipo</label>
        <select
          id="alert-type"
          value={filters.type ?? ''}
          onChange={(event) =>
            setFilters({ type: (event.target.value as keyof typeof BUSINESS_ALERT_TYPES) || undefined })
          }
        >
          <option value="">Todos</option>
          <option value={BUSINESS_ALERT_TYPES.ServiceOrderOverdue}>OS vencida</option>
          <option value={BUSINESS_ALERT_TYPES.ServiceOrderDueSoon}>OS vencendo</option>
          <option value={BUSINESS_ALERT_TYPES.ServiceOrderStalled}>OS parada</option>
          <option value={BUSINESS_ALERT_TYPES.MeasurementAging}>Medição parada</option>
          <option value={BUSINESS_ALERT_TYPES.BillingAging}>Faturamento parado</option>
          <option value={BUSINESS_ALERT_TYPES.PaymentOverdue}>Pagamento vencido</option>
        </select>

        <label htmlFor="alert-severity">Severidade</label>
        <select
          id="alert-severity"
          value={filters.severity ?? ''}
          onChange={(event) =>
            setFilters({
              severity: (event.target.value as 'WARNING' | 'CRITICAL' | '') || undefined,
            })
          }
        >
          <option value="">Todas</option>
          <option value="WARNING">Atenção</option>
          <option value="CRITICAL">Crítico</option>
        </select>
      </section>

      {items.length === 0 ? (
        <p className="alerts-page__empty">Nenhum alerta encontrado para os filtros selecionados.</p>
      ) : (
        <ul className="alerts-list">
          {items.map((item) => (
            <li key={item.id}>
              <article
                className={`alerts-card alerts-card--${item.severity.toLowerCase()}`}
                aria-label={`${item.title}: ${item.message}`}
              >
                <header className="alerts-card__header">
                  <h2>{item.title}</h2>
                  <span className="alerts-card__severity">{item.severity}</span>
                </header>
                <p className="alerts-card__message">{item.message}</p>
                <p className="alerts-card__meta">
                  Disparado em {formatWhen(item.triggeredAt)}
                  {item.resolvedAt ? ` · Resolvido em ${formatWhen(item.resolvedAt)}` : null}
                </p>
                <Link className="alerts-card__link" to={item.entityHref}>
                  Abrir entidade relacionada
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
