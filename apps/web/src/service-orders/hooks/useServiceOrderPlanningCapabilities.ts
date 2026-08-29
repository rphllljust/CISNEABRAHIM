import { useEffect, useState } from 'react';
import {
  probeServiceOrderPlanningCapabilities,
  type ServiceOrderPlanningCapabilities,
} from '../api/service-orders-api';
import { ServiceOrdersApiError } from '../api/service-orders-api';
import { useAuth } from '../../auth/context/AuthProvider';

const EMPTY: ServiceOrderPlanningCapabilities = {
  canRead: false,
  canPlan: false,
  canUpdatePlan: false,
  canRemovePlan: false,
  canAllocate: false,
  canReallocate: false,
  canRemoveAllocation: false,
  canListAllocations: false,
};

export function useServiceOrderPlanningCapabilities() {
  const { status } = useAuth();
  const [loading, setLoading] = useState(true);
  const [capabilities, setCapabilities] = useState<ServiceOrderPlanningCapabilities>(EMPTY);

  useEffect(() => {
    if (status !== 'authenticated') {
      setLoading(false);
      setCapabilities(EMPTY);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    void probeServiceOrderPlanningCapabilities(controller.signal)
      .then((result) => {
        if (!cancelled) {
          setCapabilities(result);
          setLoading(false);
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        if (error instanceof ServiceOrdersApiError && error.kind === 'denied') {
          setCapabilities(EMPTY);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [status]);

  return { loading, capabilities };
}
