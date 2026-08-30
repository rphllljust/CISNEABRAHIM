import { useEffect, useState } from 'react';
import { probeDocumentCapabilities } from '../api/documents-api';
import type { DocumentCapabilities } from '../types/document.types';

const DEFAULT_CAPABILITIES: DocumentCapabilities = {
  canCreate: false,
  canRead: false,
  canList: false,
  canUploadVersion: false,
  canDownload: false,
};

export function useDocumentCapabilities(): { capabilities: DocumentCapabilities; loading: boolean } {
  const [capabilities, setCapabilities] = useState<DocumentCapabilities>(DEFAULT_CAPABILITIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void probeDocumentCapabilities(controller.signal)
      .then((result) => {
        if (!cancelled) {
          setCapabilities(result);
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
