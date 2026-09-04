import { useCallback, useEffect, useRef, useState } from 'react';

export type AsyncResourceState<T> =
  | { phase: 'loading' }
  | { phase: 'error'; error: unknown }
  | { phase: 'ready'; data: T };

/**
 * Hook mínimo para carregar dados de leitura com estado `loading`/`error`/`ready`
 * e um `refresh` para refazer a chamada. O `loader` pode ser recriado a cada
 * render (a referência mais recente é mantida via ref), então não causa loop
 * de requisições.
 */
export function useAsyncResource<T>(loader: (signal?: AbortSignal) => Promise<T>): {
  state: AsyncResourceState<T>;
  refresh: () => void;
} {
  const [state, setState] = useState<AsyncResourceState<T>>({ phase: 'loading' });
  const [refreshIndex, setRefreshIndex] = useState(0);
  const loaderRef = useRef(loader);

  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setState({ phase: 'loading' });
    void loaderRef.current(controller.signal)
      .then((data) => {
        if (!cancelled) {
          setState({ phase: 'ready', data });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({ phase: 'error', error });
        }
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [refreshIndex]);

  const refresh = useCallback(() => setRefreshIndex((index) => index + 1), []);

  return { state, refresh };
}
