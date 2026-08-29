import { useEffect, useState } from 'react';
import {
  CatalogApiError,
  probeCatalogCapabilities,
  type CatalogCapabilities,
} from '../api/service-catalog-api';
import { useAuth } from '../../auth/context/AuthProvider';

const EMPTY_CAPABILITIES: CatalogCapabilities = {
  canList: false,
  canCreate: false,
  canRead: false,
  canUpdate: false,
  canPublish: false,
  canDeactivate: false,
  canActivate: false,
};

export function useCatalogCapabilities() {
  const { status } = useAuth();
  const [loading, setLoading] = useState(true);
  const [capabilities, setCapabilities] = useState<CatalogCapabilities>(EMPTY_CAPABILITIES);
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

    void probeCatalogCapabilities(controller.signal)
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
        if (probeError instanceof CatalogApiError && probeError.kind === 'denied') {
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
