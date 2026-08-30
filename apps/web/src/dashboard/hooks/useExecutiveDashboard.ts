import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardApiError, getExecutiveDashboard } from '../api/dashboard-api';
import type { ExecutiveDashboardFilters, ExecutiveDashboardSnapshot } from '../types/dashboard.types';

const POLL_INTERVAL_MS = 60_000;
const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
] as const;

export type ExecutiveDashboardPageState =
  | { phase: 'loading' }
  | { phase: 'denied' }
  | { phase: 'error'; message: string; partial?: ExecutiveDashboardSnapshot }
  | { phase: 'ready'; snapshot: ExecutiveDashboardSnapshot };

function readFilters(searchParams: URLSearchParams): ExecutiveDashboardFilters {
  const period = searchParams.get('period') ?? 'week';
  const unitId = searchParams.get('unitId') ?? undefined;
  const from = searchParams.get('from') ?? undefined;
  const to = searchParams.get('to') ?? undefined;
  return { period, unitId, from, to };
}

export function useExecutiveDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const [state, setState] = useState<ExecutiveDashboardPageState>({ phase: 'loading' });

  const setFilters = useCallback(
    (next: Partial<ExecutiveDashboardFilters>) => {
      const params = new URLSearchParams(searchParams);
      if (next.period !== undefined) {
        params.set('period', next.period);
      }
      if (next.unitId !== undefined) {
        if (next.unitId) {
          params.set('unitId', next.unitId);
        } else {
          params.delete('unitId');
        }
      }
      if (next.from !== undefined) {
        if (next.from) {
          params.set('from', next.from);
        } else {
          params.delete('from');
        }
      }
      if (next.to !== undefined) {
        if (next.to) {
          params.set('to', next.to);
        } else {
          params.delete('to');
        }
      }
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const reload = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const snapshot = await getExecutiveDashboard(filters, signal);
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
    },
    [filters],
  );

  useEffect(() => {
    setState({ phase: 'loading' });
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

  return { state, reload, filters, setFilters, periodOptions: PERIOD_OPTIONS };
}
