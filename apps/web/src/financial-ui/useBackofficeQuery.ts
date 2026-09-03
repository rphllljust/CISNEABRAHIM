import { useCallback, useEffect, useState } from 'react';
import { BackofficeApiError } from './enterprise-api';

export type QueryState<T> =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'denied' }
  | { phase: 'error'; message: string; retryable: boolean; kind: BackofficeApiError['kind'] }
  | { phase: 'ready'; data: T };

export function useBackofficeQuery<T>(options: {
  enabled?: boolean;
  loader: (signal?: AbortSignal) => Promise<T>;
  mapError: (code: string | undefined, status: number) => string;
  autoLoad?: boolean;
}): {
  state: QueryState<T>;
  reload: (signal?: AbortSignal) => Promise<void>;
  reset: () => void;
  setReady: (data: T) => void;
} {
  const { enabled = true, loader, mapError, autoLoad = true } = options;
  const [state, setState] = useState<QueryState<T>>(enabled && autoLoad ? { phase: 'loading' } : { phase: 'idle' });

  const reload = useCallback(
    async (signal?: AbortSignal) => {
      setState({ phase: 'loading' });
      try {
        const data = await loader(signal);
        setState({ phase: 'ready', data });
      } catch (error) {
        if (error instanceof BackofficeApiError) {
          if (error.kind === 'denied') {
            setState({ phase: 'denied' });
            return;
          }
          setState({
            phase: 'error',
            message: mapError(error.code, error.status),
            retryable: error.kind === 'network' || error.kind === 'unknown',
            kind: error.kind,
          });
          return;
        }
        setState({
          phase: 'error',
          message: mapError(undefined, 0),
          retryable: true,
          kind: 'unknown',
        });
      }
    },
    [loader, mapError],
  );

  const reset = useCallback(() => setState({ phase: 'idle' }), []);
  const setReady = useCallback((data: T) => setState({ phase: 'ready', data }), []);

  useEffect(() => {
    if (!enabled || !autoLoad) {
      return;
    }
    const controller = new AbortController();
    void reload(controller.signal);
    return () => controller.abort();
  }, [autoLoad, enabled, reload]);

  return { state, reload, reset, setReady };
}
