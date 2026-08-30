import { useState } from 'react';
import { DocumentsApiError } from '../api/documents-api';
import { mapDocumentErrorToMessage } from '../api/document-error-messages';
import { downloadDocumentContent } from '../api/documents-api';

type DocumentDownloadActionProps = {
  documentId: string;
  versionNumber: number;
  filename: string;
  disabled?: boolean;
  label?: string;
};

export function DocumentDownloadAction({
  documentId,
  versionNumber,
  filename,
  disabled = false,
  label = 'Baixar',
}: DocumentDownloadActionProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const { blob, filename: resolvedName } = await downloadDocumentContent(documentId, versionNumber);
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = resolvedName || filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof DocumentsApiError
          ? mapDocumentErrorToMessage(err.code, err.status)
          : 'Não foi possível baixar o arquivo.',
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <span className="doc-download-action">
      <button
        type="button"
        className="doc-button doc-button--ghost"
        disabled={disabled || downloading}
        onClick={() => void handleDownload()}
        aria-label={`${label} ${filename}`}
      >
        {downloading ? 'Baixando…' : label}
      </button>
      {error ? (
        <span className="doc-download-action__error" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}
