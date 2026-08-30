import { Link } from 'react-router-dom';
import { useAlertBadge } from '../hooks/useAlerts';
import '../alerts.css';

export function AlertBadgeLink() {
  const { activeCount, loading } = useAlertBadge();

  return (
    <Link className="alert-badge-link" to="/app/alerts" aria-label={`Central de alertas: ${activeCount} pendências`}>
      Alertas
      {!loading && activeCount > 0 ? (
        <span className="alert-badge-link__count" aria-hidden="true">
          {activeCount > 99 ? '99+' : activeCount}
        </span>
      ) : null}
    </Link>
  );
}
