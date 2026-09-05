import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/context/AuthProvider';
import { BackofficeApiError } from '../financial-ui/enterprise-api';
import {
  probePayableListAccess,
  probeReceivableListAccess,
  probeReconciliationReadAccess,
  probeTreasuryListAccess,
  probeExpenseReadAccess,
  probeBudgetReadAccess,
  probeForecastReadAccess,
} from './api/finance-api';

type FinanceRouteProps = {
  children: ReactNode;
  access: 'overview' | 'receivables' | 'payables' | 'treasury' | 'reconciliation' | 'expenses' | 'budgets' | 'forecast';
};

export function FinanceRoute({ children, access }: FinanceRouteProps) {
  const location = useLocation();
  const { expireSession } = useAuth();
  const [state, setState] = useState<'loading' | 'allowed' | 'denied' | 'session_expired'>('loading');

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function probe() {
      try {
        const allowed = await resolveFinanceAccess(access, controller.signal);
        if (!cancelled) {
          setState(allowed ? 'allowed' : 'denied');
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        if (error instanceof BackofficeApiError && error.status === 401) {
          expireSession();
          setState('session_expired');
          return;
        }
        setState('denied');
      }
    }

    void probe();
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
      <Navigate
        to="/app/no-access"
        replace
        state={{ from: location.pathname, capabilityId: `finance:${access}` }}
      />
    );
  }

  return children;
}

async function resolveFinanceAccess(
  access: FinanceRouteProps['access'],
  signal: AbortSignal,
): Promise<boolean> {
  if (access === 'receivables') {
    return probeReceivableListAccess(signal);
  }
  if (access === 'payables') {
    return probePayableListAccess(signal);
  }
  if (access === 'treasury') {
    return probeTreasuryListAccess(signal);
  }
  if (access === 'reconciliation') {
    return probeReconciliationReadAccess(signal);
  }
  if (access === 'expenses') {
    return probeExpenseReadAccess(signal);
  }
  if (access === 'budgets') {
    return probeBudgetReadAccess(signal);
  }
  if (access === 'forecast') {
    return probeForecastReadAccess(signal);
  }
  const [receivables, payables, treasury] = await Promise.all([
    probeReceivableListAccess(signal),
    probePayableListAccess(signal),
    probeTreasuryListAccess(signal),
  ]);
  return receivables || payables || treasury;
}
