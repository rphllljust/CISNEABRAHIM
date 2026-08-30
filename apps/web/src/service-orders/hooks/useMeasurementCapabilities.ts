import { useEffect, useState } from 'react';
import { probeMeasurementCapabilities } from '../api/measurement-api';
import type { MeasurementCapabilities } from '../types/measurement.types';

const DEFAULT_CAPABILITIES: MeasurementCapabilities = {
  canRead: false,
  canCreate: false,
  canUpdate: false,
  canSubmit: false,
  canReview: false,
  canApprove: false,
  canReject: false,
};

export function useMeasurementCapabilities() {
  const [capabilities, setCapabilities] = useState<MeasurementCapabilities>(DEFAULT_CAPABILITIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    void probeMeasurementCapabilities(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setCapabilities(result);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setCapabilities(DEFAULT_CAPABILITIES);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  return { capabilities, loading };
}
