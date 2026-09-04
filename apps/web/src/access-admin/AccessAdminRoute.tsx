import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AccessAdminApiError, probeAccessAdminAccess } from './api/access-admin-api';
import { useAuth } from '../auth/context/AuthProvider';

type AccessAdminRouteProps = {
  children: ReactNode;
};

/**
 * Gate de rota do módulo de administração de acesso.
 * Espelha `CatalogRoute`: sonda o endpoint, expira a sessão em 401 e
 * redireciona para `/app/no-access` quando negado.
 */
export function AccessAdminRoute({ children }: AccessAdminRouteProps) {
  const location = useLocation();
  const { expireSession } = useAuth();
  const [state, setState] = useState<'loading' | 'allowed' | 'denied' | 'session_expired'>(
    'loading',
  );

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void probeAccessAdminAccess(controller.signal)
      .then((allowed) => {
        if (!cancelled) {
          setState(allowed ? 'allowed' : 'denied');
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        if (error instanceof AccessAdminApiError && error.status === 401) {
          expireSession();
          setState('session_expired');
          return;
        }
        setState('denied');
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [expireSession, location.pathname]);

  if (state === 'loading') {
    return (
      <div className="shell-loading" aria-busy="true" aria-live="polite">
        <p>Verificando acesso…</p>
      </div>
    );
  }

  if (state === 'session_expired') {
    return (
      <Navigate
        to="/login"
        replace
        state={{ reason: 'session_expired', from: location.pathname }}
      />
    );
  }

  if (state === 'denied') {
    return (
      <Navigate
        to="/app/no-access"
        replace
        state={{ from: location.pathname, capabilityId: 'authz:access-admin:read' }}
      />
    );
  }

  return children;
}
