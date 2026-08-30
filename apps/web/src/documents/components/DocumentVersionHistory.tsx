import { formatIdentityLabel } from '../../shell/format-identity';
import type { DocumentVersion } from '../types/document.types';
import { formatDateTimePtBr, formatFileSize, formatMimeLabel } from '../utils/document-format';
import { DocumentDownloadAction } from './DocumentDownloadAction';

type DocumentVersionHistoryProps = {
  documentId: string;
  versions: DocumentVersion[];
  canDownload: boolean;
  canUploadVersion: boolean;
  onUploadNewVersion?: (file: File) => Promise<void>;
  uploading?: boolean;
};

export function DocumentVersionHistory({
  documentId,
  versions,
  canDownload,
  canUploadVersion,
  onUploadNewVersion,
  uploading = false,
}: DocumentVersionHistoryProps) {
  const sorted = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
  const current = sorted.find((version) => version.isCurrent) ?? sorted[0];

  return (
    <section className="doc-version-history" aria-label="Histórico de versões">
      <p className="doc-version-history__lead">
        Novas versões preservam o histórico anterior. Versões anteriores permanecem disponíveis para
        consulta — não há sobrescrita destrutiva.
      </p>

      {current ? (
        <div className="doc-version-history__current">
          <h4>Versão atual</h4>
          <dl className="doc-version-history__meta">
            <div>
              <dt>Versão</dt>
              <dd>v{current.versionNumber}</dd>
            </div>
            <div>
              <dt>Arquivo</dt>
              <dd>{current.originalFilename}</dd>
            </div>
            <div>
              <dt>Tipo</dt>
              <dd>{formatMimeLabel(current.mimeType)}</dd>
            </div>
            <div>
              <dt>Tamanho</dt>
              <dd>{formatFileSize(current.byteSize)}</dd>
            </div>
            <div>
              <dt>Publicada em</dt>
              <dd>{formatDateTimePtBr(current.publishedAt)}</dd>
            </div>
            <div>
              <dt>Autor</dt>
              <dd>{formatIdentityLabel(current.uploadedByIdentityId)}</dd>
            </div>
          </dl>
          {canDownload ? (
            <DocumentDownloadAction
              documentId={documentId}
              versionNumber={current.versionNumber}
              filename={current.originalFilename}
            />
          ) : null}
        </div>
      ) : null}

      {sorted.length > 1 ? (
        <div className="doc-version-history__previous">
          <h4>Versões anteriores</h4>
          <ul className="doc-version-history__list">
            {sorted
              .filter((version) => !version.isCurrent)
              .map((version) => (
                <li key={version.id} className="doc-version-history__item">
                  <div>
                    <p className="doc-version-history__item-title">
                      v{version.versionNumber} · {version.originalFilename}
                    </p>
                    <p className="doc-version-history__item-meta">
                      {formatDateTimePtBr(version.publishedAt)} ·{' '}
                      {formatIdentityLabel(version.uploadedByIdentityId)} ·{' '}
                      {formatFileSize(version.byteSize)}
                    </p>
                  </div>
                  {canDownload ? (
                    <DocumentDownloadAction
                      documentId={documentId}
                      versionNumber={version.versionNumber}
                      filename={version.originalFilename}
                      label="Baixar versão"
                    />
                  ) : null}
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      {canUploadVersion && onUploadNewVersion ? (
        <label className="doc-version-history__upload">
          <span>Enviar nova versão</span>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) {
                void onUploadNewVersion(file);
              }
            }}
          />
          <span className="doc-field__hint">
            A versão anterior será preservada no histórico.
          </span>
        </label>
      ) : null}
    </section>
  );
}
