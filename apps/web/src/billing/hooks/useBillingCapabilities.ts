import { useEffect, useState } from 'react';
import { probeBillingCapabilities } from '../api/billing-api';
import { probeBillingDocumentCapabilities } from '../api/billing-document-api';
import type { BillingCapabilities } from '../types/billing.types';

const DEFAULT_CAPABILITIES: BillingCapabilities = {
  canRead: false,
  canPrepare: false,
  canVoid: false,
  canIssueDocument: false,
  canReadDocument: false,
  canDownloadDocument: false,
};

export function useBillingCapabilities(): { capabilities: BillingCapabilities; loading: boolean } {
  const [capabilities, setCapabilities] = useState<BillingCapabilities>(DEFAULT_CAPABILITIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void Promise.all([
      probeBillingCapabilities(controller.signal),
      probeBillingDocumentCapabilities(controller.signal),
    ])
      .then(([billing, documents]) => {
        if (!cancelled) {
          setCapabilities({
            ...billing,
            ...documents,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCapabilities(DEFAULT_CAPABILITIES);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return { capabilities, loading };
}
