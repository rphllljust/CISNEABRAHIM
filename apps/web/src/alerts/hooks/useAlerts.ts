import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertApiError, getAlertSummary, getAlerts } from '../api/alerts-api';
import type {
  AlertListFilters,
  BusinessAlertListItem,
  BusinessAlertSeverity,
  BusinessAlertStatus,
  BusinessAlertType,
} from '../types/alerts.types';

const POLL_INTERVAL_MS = 60_000;

export type AlertCenterState =
  | { phase: 'loading' }
  | { phase: 'denied' }
  | { phase: 'error'; message: string; partial?: BusinessAlertListItem[] }
  | { phase: 'ready'; items: BusinessAlertListItem[] };

function readFilters(searchParams: URLSearchParams): AlertListFilters {
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const severity = searchParams.get('severity');
  return {
    status: status === 'ACTIVE' || status === 'RESOLVED' ? status : 'ACTIVE',
    type: (type as BusinessAlertType | null) ?? undefined,
    severity: (severity as BusinessAlertSeverity | null) ?? undefined,
  };
}

export function useAlertsCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const [state, setState] = useState<AlertCenterState>({ phase: 'loading' });

  const setFilters = useCallback(
    (next: Partial<AlertListFilters>) => {
      const params = new URLSearchParams(searchParams);
      if (next.status !== undefined) {
        params.set('status', next.status);
      }
      if (next.type !== undefined) {
        if (next.type) {
          params.set('type', next.type);
        } else {
          params.delete('type');
        }
      }
      if (next.severity !== undefined) {
        if (next.severity) {
          params.set('severity', next.severity);
        } else {
          params.delete('severity');
        }
      }
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const reload = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const items = await getAlerts(filters, signal);
        setState({ phase: 'ready', items });
      } catch (error) {
        if (error instanceof AlertApiError && error.kind === 'denied') {
          setState({ phase: 'denied' });
          return;
        }
        setState((previous) => ({
          phase: 'error',
          message:
            error instanceof AlertApiError && error.kind === 'network'
              ? 'Não foi possível carregar os alertas.'
              : 'Falha ao carregar os alertas.',
          partial: previous.phase === 'ready' ? previous.items : undefined,
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

  return { state, reload, filters, setFilters };
}

export function useAlertBadge() {
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const summary = await getAlertSummary(controller.signal);
        setActiveCount(summary.activeCount);
      } catch {
        setActiveCount(0);
      } finally {
        setLoading(false);
      }
    }
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, POLL_INTERVAL_MS);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  return { activeCount, loading };
}
