import { useEffect, useState } from 'react';
import { AuthzApiError, probeRequest } from '../auth/api/authz-api';
import { probeClientListAccess } from '../clients/api/clients-api';
import { probeCatalogListAccess } from '../catalog/api/service-catalog-api';
import { probeAssetListAccess } from '../assets/api/physical-assets-api';
import { probeServiceRequestListAccess } from '../requests/api/service-requests-api';
import { probeProposalListAccess } from '../proposals/api/proposals-api';
import { probePurchaseOrderListAccess } from '../purchase-orders/api/purchase-orders-api';
import { probeBillingCapabilities } from '../billing/api/billing-api';
import { probeServiceOrderListAccess } from '../service-orders/api/service-orders-api';
import { probePersonListAccess } from '../people/api/people-api';
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
          continue;
        }

        if (item.accessCheck === 'client-list') {
          try {
            const allowed = await probeClientListAccess(controller.signal);
            nextAccess[item.id] = allowed;
          } catch {
            if (!cancelled) {
              nextAccess[item.id] = false;
            }
          }
          continue;
        }

        if (item.accessCheck === 'catalog-list') {
          try {
            const allowed = await probeCatalogListAccess(controller.signal);
            nextAccess[item.id] = allowed;
          } catch {
            if (!cancelled) {
              nextAccess[item.id] = false;
            }
          }
          continue;
        }

        if (item.accessCheck === 'asset-list') {
          try {
            const allowed = await probeAssetListAccess(controller.signal);
            nextAccess[item.id] = allowed;
          } catch {
            if (!cancelled) {
              nextAccess[item.id] = false;
            }
          }
          continue;
        }

        if (item.accessCheck === 'request-list') {
          try {
            const allowed = await probeServiceRequestListAccess(controller.signal);
            nextAccess[item.id] = allowed;
          } catch {
            if (!cancelled) {
              nextAccess[item.id] = false;
            }
          }
          continue;
        }

        if (item.accessCheck === 'proposal-list') {
          try {
            const allowed = await probeProposalListAccess(controller.signal);
            nextAccess[item.id] = allowed;
          } catch {
            if (!cancelled) {
              nextAccess[item.id] = false;
            }
          }
          continue;
        }

        if (item.accessCheck === 'purchase-order-list') {
          try {
            const allowed = await probePurchaseOrderListAccess(controller.signal);
            nextAccess[item.id] = allowed;
          } catch {
            if (!cancelled) {
              nextAccess[item.id] = false;
            }
          }
          continue;
        }

        if (item.accessCheck === 'billing-list') {
          try {
            const capabilities = await probeBillingCapabilities(controller.signal);
            nextAccess[item.id] = capabilities.canRead;
          } catch {
            if (!cancelled) {
              nextAccess[item.id] = false;
            }
          }
          continue;
        }

        if (item.accessCheck === 'service-order-list') {
          try {
            const allowed = await probeServiceOrderListAccess(controller.signal);
            nextAccess[item.id] = allowed;
          } catch {
            if (!cancelled) {
              nextAccess[item.id] = false;
            }
          }
          continue;
        }

        if (item.accessCheck === 'people-list') {
          try {
            const allowed = await probePersonListAccess(controller.signal);
            nextAccess[item.id] = allowed;
          } catch {
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
