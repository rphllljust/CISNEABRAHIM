import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/context/AuthProvider';
import {
  PurchaseOrdersApiError,
  probePurchaseOrderCapabilities,
  type PurchaseOrderCapabilities,
} from '../api/purchase-orders-api';

const EMPTY_CAPABILITIES: PurchaseOrderCapabilities = {
  canList: false,
  canCreate: false,
  canRead: false,
  canUpdate: false,
  canRegister: false,
  canCancel: false,
};

export function usePurchaseOrderCapabilities() {
  const { status } = useAuth();
  const [loading, setLoading] = useState(true);
  const [capabilities, setCapabilities] = useState<PurchaseOrderCapabilities>(EMPTY_CAPABILITIES);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (status !== 'authenticated') {
      setLoading(false);
      setCapabilities(EMPTY_CAPABILITIES);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    void probePurchaseOrderCapabilities(controller.signal)
      .then((result) => {
        if (!cancelled) {
          setCapabilities(result);
          setError(false);
          setLoading(false);
        }
      })
      .catch((probeError: unknown) => {
        if (cancelled) {
          return;
        }
        if (probeError instanceof PurchaseOrdersApiError && probeError.kind === 'denied') {
          setCapabilities(EMPTY_CAPABILITIES);
          setError(false);
        } else {
          setError(true);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [status]);

  return { loading, capabilities, error };
}
