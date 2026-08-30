import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchApiError, searchEntities } from '../api/search-api';
import type { SearchEntityType, SearchFilters, SearchResponse } from '../types/search.types';

const DEBOUNCE_MS = 300;
const RECENT_SEARCHES_KEY = 'cisne.recentSearches';
const RECENT_SEARCHES_ENABLED = import.meta.env['VITE_SEARCH_RECENT_ENABLED'] === 'true';

export type SearchState =
  | { phase: 'idle' }
  | { phase: 'loading'; query: string }
  | { phase: 'denied' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; response: SearchResponse };

function readFilters(searchParams: URLSearchParams): SearchFilters {
  const q = searchParams.get('q')?.trim() ?? '';
  const types = searchParams.get('types');
  const status = searchParams.get('status') ?? undefined;
  const clientId = searchParams.get('clientId') ?? undefined;
  const serviceDefinitionId = searchParams.get('serviceDefinitionId') ?? undefined;
  const from = searchParams.get('from') ?? undefined;
  const to = searchParams.get('to') ?? undefined;
  const offset = searchParams.get('offset');
  return {
    q,
    types: types
      ? (types.split(',').filter(Boolean) as SearchEntityType[])
      : undefined,
    status,
    clientId,
    serviceDefinitionId,
    from,
    to,
    offset: offset ? Number.parseInt(offset, 10) : 0,
  };
}

export function useGlobalSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const [state, setState] = useState<SearchState>({ phase: 'idle' });
  const requestIdRef = useRef(0);

  const setFilters = useCallback(
    (next: Partial<SearchFilters>) => {
      const params = new URLSearchParams(searchParams);
      if (next.q !== undefined) {
        if (next.q.trim()) {
          params.set('q', next.q.trim());
        } else {
          params.delete('q');
        }
      }
      if (next.types !== undefined) {
        if (next.types.length > 0) {
          params.set('types', next.types.join(','));
        } else {
          params.delete('types');
        }
      }
      if (next.status !== undefined) {
        if (next.status) {
          params.set('status', next.status);
        } else {
          params.delete('status');
        }
      }
      if (next.offset !== undefined) {
        if (next.offset > 0) {
          params.set('offset', String(next.offset));
        } else {
          params.delete('offset');
        }
      }
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    const query = filters.q.trim();
    if (query.length < 2) {
      setState({ phase: 'idle' });
      return;
    }

    const controller = new AbortController();
    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;
    setState({ phase: 'loading', query });

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await searchEntities(filters, controller.signal);
          if (requestIdRef.current !== currentRequestId) {
            return;
          }
          setState({ phase: 'ready', response });
          if (RECENT_SEARCHES_ENABLED) {
            persistRecentSearch(query);
          }
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return;
          }
          if (requestIdRef.current !== currentRequestId) {
            return;
          }
          if (error instanceof SearchApiError && error.kind === 'denied') {
            setState({ phase: 'denied' });
            return;
          }
          setState({
            phase: 'error',
            message:
              error instanceof SearchApiError && error.kind === 'invalid'
                ? 'Consulta inválida.'
                : 'Não foi possível buscar agora.',
          });
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [filters]);

  return { state, filters, setFilters };
}

export function readRecentSearches(): string[] {
  if (!RECENT_SEARCHES_ENABLED || typeof sessionStorage === 'undefined') {
    return [];
  }
  try {
    const raw = sessionStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function persistRecentSearch(query: string): void {
  if (!RECENT_SEARCHES_ENABLED || typeof sessionStorage === 'undefined') {
    return;
  }
  const existing = readRecentSearches().filter((entry) => entry !== query);
  sessionStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([query, ...existing].slice(0, 5)));
}
