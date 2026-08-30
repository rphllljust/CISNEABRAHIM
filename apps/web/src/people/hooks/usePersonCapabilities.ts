import { useEffect, useState } from 'react';
import { PeopleApiError, probePersonCapabilities, type PersonCapabilities } from '../api/people-api';
import { useAuth } from '../../auth/context/AuthProvider';

const EMPTY_CAPABILITIES: PersonCapabilities = {
  canList: false,
  canCreate: false,
  canRead: false,
  canUpdate: false,
  canDeactivate: false,
  canActivate: false,
};

export function usePersonCapabilities() {
  const { status } = useAuth();
  const [loading, setLoading] = useState(true);
  const [capabilities, setCapabilities] = useState<PersonCapabilities>(EMPTY_CAPABILITIES);
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

    void probePersonCapabilities(controller.signal)
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
        if (probeError instanceof PeopleApiError && probeError.kind === 'denied') {
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
