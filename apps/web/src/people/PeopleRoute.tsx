import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { PeopleApiError, probePersonListAccess } from './api/people-api';
import { useAuth } from '../auth/context/AuthProvider';

type PeopleRouteProps = {
  children: ReactNode;
};

export function PeopleRoute({ children }: PeopleRouteProps) {
  const location = useLocation();
  const { expireSession } = useAuth();
  const [state, setState] = useState<'loading' | 'allowed' | 'denied' | 'session_expired'>(
    'loading',
  );

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void probePersonListAccess(controller.signal)
      .then((allowed) => {
        if (!cancelled) {
          setState(allowed ? 'allowed' : 'denied');
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        if (error instanceof PeopleApiError && error.status === 401) {
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
        state={{ from: location.pathname, capabilityId: 'people:person:list' }}
      />
    );
  }

  return children;
}
