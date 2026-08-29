import { useEffect, useState } from 'react';
import { AuthzApiError, probeRequest } from '../auth/api/authz-api';
import { useAuth } from '../auth/context/AuthProvider';
import { SHELL_NAV_ITEMS } from './nav-config';
import type { NavAccessMap } from './types';

type NavAccessState = {
  loading: boolean;
  access: NavAccessMap;
};

const INITIAL_ACCESS: NavAccessMap = Object.fromEntries(
  SHELL_NAV_ITEMS.map((item) => [item.id, item.accessCheck ? false : true]),
);

export function useNavAccess(): NavAccessState {
  const { status } = useAuth();
  const [state, setState] = useState<NavAccessState>({
    loading: true,
    access: INITIAL_ACCESS,
  });

  useEffect(() => {
    if (status !== 'authenticated') {
      setState({ loading: false, access: INITIAL_ACCESS });
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    async function resolveAccess() {
      const nextAccess: NavAccessMap = { ...INITIAL_ACCESS };

      for (const item of SHELL_NAV_ITEMS) {
        if (!item.accessCheck) {
          nextAccess[item.id] = true;
          continue;
        }

        if (item.accessCheck === 'authz-probe') {
          try {
            await probeRequest(controller.signal);
            nextAccess[item.id] = true;
          } catch (error) {
            if (error instanceof AuthzApiError && error.status === 403) {
              nextAccess[item.id] = false;
              continue;
            }
            if (!cancelled) {
              nextAccess[item.id] = false;
            }
          }
        }
      }

      if (!cancelled) {
        setState({ loading: false, access: nextAccess });
      }
    }

    void resolveAccess();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [status]);

  return state;
}

export function isNavItemVisible(itemId: string, access: NavAccessMap, loading: boolean): boolean {
  const item = SHELL_NAV_ITEMS.find((entry) => entry.id === itemId);
  if (!item) {
    return false;
  }
  if (!item.accessCheck) {
    return true;
  }
  if (loading) {
    return false;
  }
  return access[itemId] === true;
}
