import { useCallback, useEffect, useState } from 'react';
import { DashboardApiError, getOperationalDashboard } from '../api/dashboard-api';
import type { OperationalDashboardSnapshot } from '../types/dashboard.types';

const POLL_INTERVAL_MS = 60_000;

export type DashboardPageState =
  | { phase: 'loading' }
  | { phase: 'denied' }
  | { phase: 'error'; message: string; partial?: OperationalDashboardSnapshot }
  | { phase: 'ready'; snapshot: OperationalDashboardSnapshot };

export function useOperationalDashboard() {
  const [state, setState] = useState<DashboardPageState>({ phase: 'loading' });

  const reload = useCallback(async (signal?: AbortSignal) => {
    try {
      const snapshot = await getOperationalDashboard(signal);
      setState({ phase: 'ready', snapshot });
    } catch (error) {
      if (error instanceof DashboardApiError && error.kind === 'denied') {
        setState({ phase: 'denied' });
        return;
      }
      setState((previous) => ({
        phase: 'error',
        message:
          error instanceof DashboardApiError && error.kind === 'network'
            ? 'Não foi possível atualizar o painel operacional.'
            : 'Falha ao carregar o painel operacional.',
        partial: previous.phase === 'ready' ? previous.snapshot : undefined,
      }));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void reload(controller.signal);
    const timer = window.setInterval(() => {
      void reload(controller.signal);
    }, POLL_INTERVAL_MS);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [reload]);

  return { state, reload };
}
