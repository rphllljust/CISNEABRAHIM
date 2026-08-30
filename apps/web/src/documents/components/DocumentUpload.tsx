import { useCallback, useId, useRef, useState } from 'react';
import type { DocumentUploadQueueItem } from '../types/document.types';
import { formatFileSize, formatMimeLabel } from '../utils/document-format';
import { validateDocumentFile } from '../utils/document-validation';

export type DocumentUploadHandler = (
  file: File,
  onProgress: (progress: number) => void,
) => Promise<void>;

type DocumentUploadProps = {
  disabled?: boolean;
  onUpload: DocumentUploadHandler;
  inputLabel?: string;
};

export function DocumentUpload({
  disabled = false,
  onUpload,
  inputLabel = 'Selecionar arquivo',
}: DocumentUploadProps) {
  const inputId = useId();
  const dropId = useId();
  const [items, setItems] = useState<DocumentUploadQueueItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const retryInputRef = useRef<HTMLInputElement>(null);

  const updateItem = useCallback((id: string, patch: Partial<DocumentUploadQueueItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const runUpload = useCallback(
    async (item: DocumentUploadQueueItem, file: File) => {
      const validationError = validateDocumentFile(file);
      if (validationError) {
        updateItem(item.id, { state: 'error', errorMessage: validationError });
        return;
      }

      updateItem(item.id, {
        state: 'uploading',
        progress: 0,
        errorMessage: null,
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        byteSize: file.size,
      });

      try {
        await onUpload(file, (progress) => {
          updateItem(item.id, { progress });
        });
        updateItem(item.id, { state: 'success', progress: 100 });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Falha ao enviar arquivo. Tente novamente.';
        updateItem(item.id, { state: 'error', errorMessage: message });
      }
    },
    [onUpload, updateItem],
  );

  const enqueueFile = useCallback(
    (file: File | null) => {
      if (!file || disabled) {
        return;
      }
      const item: DocumentUploadQueueItem = {
        id: crypto.randomUUID(),
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        byteSize: file.size,
        state: 'queued',
        progress: 0,
        errorMessage: null,
      };
      setItems((current) => [...current, item]);
      void runUpload(item, file);
    },
    [disabled, runUpload],
  );

  const retryUpload = useCallback(
    (item: DocumentUploadQueueItem) => {
      const input = retryInputRef.current;
      if (!input) {
        return;
      }
      input.value = '';
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          void runUpload(item, file);
        }
      };
      input.click();
    },
    [runUpload],
  );

  return (
    <section className="doc-upload" aria-labelledby={`${dropId}-label`}>
      <h3 id={`${dropId}-label`} className="doc-upload__title">
        Enviar documento
      </h3>

      <div
        className={`doc-upload__dropzone${dragActive ? ' doc-upload__dropzone--active' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) {
            setDragActive(true);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          if (disabled) {
            return;
          }
          enqueueFile(event.dataTransfer.files[0] ?? null);
        }}
      >
        <p className="doc-upload__dropzone-text">Arraste um arquivo aqui (desktop)</p>
        <label className="doc-button doc-button--primary doc-upload__button" htmlFor={inputId}>
          {inputLabel}
        </label>
        <input
          id={inputId}
          type="file"
          className="doc-sr-only"
          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
          disabled={disabled}
          onChange={(event) => {
            enqueueFile(event.target.files?.[0] ?? null);
            event.target.value = '';
          }}
        />
        <p className="doc-field__hint">PDF, JPEG ou PNG · até 25 MB · um arquivo por envio</p>
      </div>

      {items.length > 0 ? (
        <ul className="doc-upload__queue" aria-live="polite">
          {items.map((item) => (
            <li key={item.id} className={`doc-upload__item doc-upload__item--${item.state}`}>
              <div className="doc-upload__item-main">
                <p className="doc-upload__item-name">{item.fileName}</p>
                <p className="doc-upload__item-meta">
                  {formatMimeLabel(item.contentType)} · {formatFileSize(item.byteSize)}
                </p>
                <p className="doc-upload__item-status">
                  {item.state === 'queued' && 'Na fila'}
                  {item.state === 'uploading' && `Enviando (${item.progress}%)`}
                  {item.state === 'linking' && 'Vinculando ao registro…'}
                  {item.state === 'success' && 'Enviado com sucesso'}
                  {item.state === 'error' && (item.errorMessage ?? 'Falha no envio')}
                </p>
              </div>
              {item.state === 'uploading' || item.state === 'linking' ? (
                <progress
                  className="doc-upload__progress"
                  max={100}
                  value={item.progress}
                  aria-label={`Progresso do envio de ${item.fileName}`}
                />
              ) : null}
              {item.state === 'error' ? (
                <button
                  type="button"
                  className="doc-button"
                  onClick={() => retryUpload(item)}
                >
                  Tentar novamente
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <input ref={retryInputRef} type="file" className="doc-sr-only" tabIndex={-1} aria-hidden="true" />
    </section>
  );
}
