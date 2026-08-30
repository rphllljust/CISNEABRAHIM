import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type {
  EvidenceUploadItem,
  ExecutionEvidenceKind,
} from '../types/service-order-execution.types';
import { createIdempotencyKey } from '../utils/create-idempotency-key';
import { labelForEvidenceKind } from '../utils/execution-requirements';

export type EvidenceUploadHandler = (
  item: EvidenceUploadItem,
  file: File,
  onProgress: (progress: number) => void,
) => Promise<void>;

type EvidenceUploaderProps = {
  evidenceKinds: ExecutionEvidenceKind[];
  disabled?: boolean;
  onUpload: EvidenceUploadHandler;
};

function revokePreview(item: EvidenceUploadItem): void {
  if (item.previewUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(item.previewUrl);
  }
}

export function EvidenceUploader({ evidenceKinds, disabled = false, onUpload }: EvidenceUploaderProps) {
  const inputId = useId();
  const [items, setItems] = useState<EvidenceUploadItem[]>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        revokePreview(item);
      }
    };
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<EvidenceUploadItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const runUpload = useCallback(
    async (item: EvidenceUploadItem, file: File) => {
      updateItem(item.id, { state: 'uploading', progress: 0, errorMessage: null });
      try {
        await onUpload(item, file, (progress) => {
          updateItem(item.id, { progress });
        });
        updateItem(item.id, { state: 'success', progress: 100 });
        revokePreview(item);
        updateItem(item.id, { previewUrl: null });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Falha ao enviar evidência. Tente novamente.';
        updateItem(item.id, { state: 'error', errorMessage: message });
      }
    },
    [onUpload, updateItem],
  );

  const enqueueFiles = useCallback(
    (files: FileList | null, kind: ExecutionEvidenceKind) => {
      if (!files || disabled) {
        return;
      }
      const nextItems: EvidenceUploadItem[] = [];
      for (const file of Array.from(files)) {
        const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
        nextItems.push({
          id: crypto.randomUUID(),
          evidenceKind: kind,
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          previewUrl,
          state: 'queued',
          progress: 0,
          errorMessage: null,
          idempotencyKey: createIdempotencyKey(),
        });
      }
      setItems((current) => [...current, ...nextItems]);
      for (const item of nextItems) {
        const file = Array.from(files).find((entry) => entry.name === item.fileName);
        if (file) {
          void runUpload(item, file);
        }
      }
    },
    [disabled, runUpload],
  );

  const retryUpload = useCallback(
    (item: EvidenceUploadItem, fileInput: HTMLInputElement) => {
      fileInput.value = '';
      fileInput.onchange = () => {
        const file = fileInput.files?.[0];
        if (!file) {
          return;
        }
        const retryItem: EvidenceUploadItem = {
          ...item,
          idempotencyKey: createIdempotencyKey(),
          state: 'queued',
          progress: 0,
          errorMessage: null,
        };
        setItems((current) => current.map((entry) => (entry.id === item.id ? retryItem : entry)));
        void runUpload(retryItem, file);
      };
      fileInput.click();
    },
    [runUpload],
  );

  const retryInputRef = useRef<HTMLInputElement>(null);

  if (evidenceKinds.length === 0) {
    return null;
  }

  return (
    <section className="execution-section" aria-labelledby="execution-evidence-title">
      <h2 id="execution-evidence-title">Evidências</h2>
      <p className="execution-hint">Envios em andamento não bloqueiam o restante da tela.</p>
      {evidenceKinds.map((kind) => (
        <div key={kind} className="execution-evidence-kind">
          <label className="execution-evidence-kind__label" htmlFor={`${inputId}-${kind}`}>
            {labelForEvidenceKind(kind)}
          </label>
          <input
            id={`${inputId}-${kind}`}
            type="file"
            accept={kind === 'PHOTO' ? 'image/*' : undefined}
            disabled={disabled}
            className="execution-evidence-kind__input"
            onChange={(event) => {
              enqueueFiles(event.target.files, kind);
              event.target.value = '';
            }}
          />
        </div>
      ))}
      {items.length > 0 ? (
        <ul className="execution-upload-list" aria-live="polite">
          {items.map((item) => (
            <li key={item.id} className={`execution-upload-item execution-upload-item--${item.state}`}>
              <div className="execution-upload-item__meta">
                {item.previewUrl ? (
                  <img src={item.previewUrl} alt="" className="execution-upload-item__thumb" />
                ) : (
                  <span className="execution-upload-item__file" aria-hidden="true">
                    📄
                  </span>
                )}
                <div>
                  <p className="execution-upload-item__name">{item.fileName}</p>
                  <p className="execution-upload-item__state">
                    {item.state === 'queued' && 'Na fila'}
                    {item.state === 'uploading' && `Enviando (${item.progress}%)`}
                    {item.state === 'success' && 'Enviado'}
                    {item.state === 'error' && (item.errorMessage ?? 'Falha no envio')}
                  </p>
                </div>
              </div>
              {item.state === 'uploading' ? (
                <progress
                  className="execution-upload-item__progress"
                  max={100}
                  value={item.progress}
                  aria-label={`Progresso do envio de ${item.fileName}`}
                />
              ) : null}
              {item.state === 'error' ? (
                <button
                  type="button"
                  className="button-secondary execution-upload-item__retry"
                  onClick={() => {
                    if (retryInputRef.current) {
                      retryUpload(item, retryInputRef.current);
                    }
                  }}
                >
                  Tentar novamente
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      <input ref={retryInputRef} type="file" className="execution-sr-only" tabIndex={-1} aria-hidden="true" />
    </section>
  );
}
