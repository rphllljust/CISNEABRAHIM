import { useEffect, useState } from 'react';
import {
  AssetsApiError,
  listPhysicalResourceTypes,
  probeAssetCapabilities,
  type AssetCapabilities,
} from '../api/physical-assets-api';
import { useAuth } from '../../auth/context/AuthProvider';

const EMPTY_CAPABILITIES: AssetCapabilities = {
  canList: false,
  canCreate: false,
  canRead: false,
  canUpdate: false,
  canDeactivate: false,
  canActivate: false,
};

export function useAssetCapabilities() {
  const { status } = useAuth();
  const [loading, setLoading] = useState(true);
  const [capabilities, setCapabilities] = useState<AssetCapabilities>(EMPTY_CAPABILITIES);
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

    void probeAssetCapabilities(controller.signal)
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
        if (probeError instanceof AssetsApiError && probeError.kind === 'denied') {
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

export function useAssetResourceTypes() {
  const [loading, setLoading] = useState(true);
  const [resourceTypes, setResourceTypes] = useState<
    Awaited<ReturnType<typeof listPhysicalResourceTypes>>
  >([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void listPhysicalResourceTypes(controller.signal)
      .then((items) => {
        if (!cancelled) {
          setResourceTypes(items);
          setError(false);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return { loading, resourceTypes, error };
}
