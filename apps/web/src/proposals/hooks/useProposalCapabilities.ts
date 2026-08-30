import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/context/AuthProvider';
import {
  ProposalsApiError,
  probeProposalCapabilities,
  type ProposalCapabilities,
} from '../api/proposals-api';

const EMPTY_CAPABILITIES: ProposalCapabilities = {
  canList: false,
  canCreate: false,
  canRead: false,
  canUpdate: false,
  canIssue: false,
  canAccept: false,
  canReject: false,
  canExpire: false,
  canCancel: false,
};

export function useProposalCapabilities() {
  const { status } = useAuth();
  const [loading, setLoading] = useState(true);
  const [capabilities, setCapabilities] = useState<ProposalCapabilities>(EMPTY_CAPABILITIES);
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

    void probeProposalCapabilities(controller.signal)
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
        if (probeError instanceof ProposalsApiError && probeError.kind === 'denied') {
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
