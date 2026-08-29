import { useEffect, useState } from 'react';
import {
  probeServiceRequestCapabilities,
  type ServiceRequestCapabilities,
} from '../api/service-requests-api';
import { ServiceRequestsApiError } from '../api/service-requests-api';
import { useAuth } from '../../auth/context/AuthProvider';

const EMPTY_CAPABILITIES: ServiceRequestCapabilities = {
  canList: false,
  canCreate: false,
  canRead: false,
  canUpdate: false,
  canSubmit: false,
  canReview: false,
  canApprove: false,
  canReject: false,
  canCancel: false,
};

export function useServiceRequestCapabilities() {
  const { status } = useAuth();
  const [loading, setLoading] = useState(true);
  const [capabilities, setCapabilities] = useState<ServiceRequestCapabilities>(EMPTY_CAPABILITIES);
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

    void probeServiceRequestCapabilities(controller.signal)
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
        if (probeError instanceof ServiceRequestsApiError && probeError.kind === 'denied') {
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
