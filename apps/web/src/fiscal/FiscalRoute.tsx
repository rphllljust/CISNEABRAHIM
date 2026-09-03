import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/context/AuthProvider';
import { BackofficeApiError } from '../financial-ui/enterprise-api';
import { probeFiscalDocumentReadAccess, probeTaxReadAccess } from './api/fiscal-api';

type FiscalRouteProps = {
  children: ReactNode;
  access: 'documents' | 'tax';
};

export function FiscalRoute({ children, access }: FiscalRouteProps) {
  const location = useLocation();
  const { expireSession } = useAuth();
  const [state, setState] = useState<'loading' | 'allowed' | 'denied' | 'session_expired'>('loading');

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const probe = access === 'documents' ? probeFiscalDocumentReadAccess : probeTaxReadAccess;
    void probe(controller.signal)
      .then((allowed) => {
        if (!cancelled) {
          setState(allowed ? 'allowed' : 'denied');
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        if (error instanceof BackofficeApiError && error.status === 401) {
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
  }, [access, expireSession, location.pathname]);

  if (state === 'loading') {
    return (
      <div className="shell-loading" aria-busy="true" aria-live="polite">
        <p>Verificando acesso…</p>
      </div>
    );
  }
  if (state === 'session_expired') {
    return <Navigate to="/login" replace state={{ reason: 'session_expired', from: location.pathname }} />;
  }
  if (state === 'denied') {
    return (
      <Navigate to="/app/no-access" replace state={{ from: location.pathname, capabilityId: `fiscal:${access}` }} />
    );
  }
  return children;
}
