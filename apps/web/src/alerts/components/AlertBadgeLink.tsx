import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAlertBadge } from '../hooks/useAlerts';

export function AlertBadgeLink() {
  const { activeCount, loading } = useAlertBadge();

  return (
    <Link
      className="relative rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      to="/app/alerts"
      aria-label={`Central de alertas: ${activeCount} pendências`}
    >
      <Bell className="h-5 w-5" strokeWidth={2} aria-hidden />
      <span className="sr-only">Alertas</span>
      {!loading && activeCount > 0 ? (
        <span className="absolute top-1.5 right-1.5 flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
      ) : null}
    </Link>
  );
}
