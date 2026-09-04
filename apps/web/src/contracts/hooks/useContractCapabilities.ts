import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/context/AuthProvider';
import {
  ContractsApiError,
  probeContractCapabilities,
  type ContractCapabilities,
} from '../api/contracts-api';

const EMPTY_CAPABILITIES: ContractCapabilities = {
  canList: false,
  canCreate: false,
  canRead: false,
  canUpdate: false,
  canActivate: false,
  canClose: false,
  canExpire: false,
};

export function useContractCapabilities() {
  const { status } = useAuth();
  const [loading, setLoading] = useState(true);
  const [capabilities, setCapabilities] = useState<ContractCapabilities>(EMPTY_CAPABILITIES);
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

    void probeContractCapabilities(controller.signal)
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
        if (probeError instanceof ContractsApiError && probeError.kind === 'denied') {
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
