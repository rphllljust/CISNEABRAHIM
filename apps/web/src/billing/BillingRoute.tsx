import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { probeBillingCapabilities } from './api/billing-api';
import { useAuth } from '../auth/context/AuthProvider';

type BillingRouteProps = {
  children: ReactNode;
};

export function BillingRoute({ children }: BillingRouteProps) {
  const location = useLocation();
  const { expireSession } = useAuth();
  const [state, setState] = useState<'loading' | 'allowed' | 'denied' | 'session_expired'>('loading');

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void probeBillingCapabilities(controller.signal)
      .then((capabilities) => {
        if (!cancelled) {
          setState(capabilities.canRead ? 'allowed' : 'denied');
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        if (error instanceof Error && error.message === 'denied') {
          setState('denied');
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
    return <Navigate to="/login" replace state={{ reason: 'session_expired', from: location.pathname }} />;
  }

  if (state === 'denied') {
    return (
      <Navigate
        to="/app/no-access"
        replace
        state={{ from: location.pathname, capabilityId: 'billing:billing-record:read' }}
      />
    );
  }

  return children;
}
