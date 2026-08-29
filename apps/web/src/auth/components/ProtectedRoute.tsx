import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <main aria-busy="true" aria-live="polite">
        <p>Loading session…</p>
      </main>
    );
  }

  if (status === 'unavailable') {
    return <Navigate to="/unavailable" replace state={{ from: location.pathname }} />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
