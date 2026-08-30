import { Fragment, useState } from 'react';
import type { DocumentDetail, DocumentLinkRef, DocumentVersion } from '../types/document.types';
import { formatDateTimePtBr, formatFileSize, formatMimeLabel } from '../utils/document-format';
import { DocumentVersionHistory } from './DocumentVersionHistory';

export type DocumentListEntry = {
  link: DocumentLinkRef;
  document: DocumentDetail | null;
  currentVersion: DocumentVersion | null;
  versions?: DocumentVersion[];
  loadError?: string | null;
};

type DocumentListProps = {
  scopeLabel: string;
  entries: DocumentListEntry[];
  canDownload: boolean;
  canUploadVersion: boolean;
  onExpand?: (documentId: string) => Promise<DocumentVersion[]>;
  onUploadNewVersion?: (documentId: string, file: File) => Promise<void>;
  versionUploadingId?: string | null;
};

export function DocumentList({
  scopeLabel,
  entries,
  canDownload,
  canUploadVersion,
  onExpand,
  onUploadNewVersion,
  versionUploadingId = null,
}: DocumentListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [versionsByDocument, setVersionsByDocument] = useState<Record<string, DocumentVersion[]>>({});
  const [loadingVersionsId, setLoadingVersionsId] = useState<string | null>(null);

  const toggleExpanded = async (documentId: string) => {
    if (expandedId === documentId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(documentId);
    if (!versionsByDocument[documentId] && onExpand) {
      setLoadingVersionsId(documentId);
      try {
        const versions = await onExpand(documentId);
        setVersionsByDocument((current) => ({ ...current, [documentId]: versions }));
      } finally {
        setLoadingVersionsId(null);
      }
    }
  };

  if (entries.length === 0) {
    return (
      <p className="doc-list__empty">
        Nenhum documento vinculado a este {scopeLabel.toLowerCase()}.
      </p>
    );
  }

  const renderVersionPanel = (document: DocumentDetail, fallbackVersion: DocumentVersion | null) => {
    const versions =
      versionsByDocument[document.id] ?? (fallbackVersion ? [fallbackVersion] : []);
    if (loadingVersionsId === document.id) {
      return <p className="doc-list__loading">Carregando versões…</p>;
    }
    return (
      <DocumentVersionHistory
        documentId={document.id}
        versions={versions}
        canDownload={canDownload}
        canUploadVersion={canUploadVersion}
        uploading={versionUploadingId === document.id}
        onUploadNewVersion={
          onUploadNewVersion ? async (file) => onUploadNewVersion(document.id, file) : undefined
        }
      />
    );
  };

  return (
    <>
      <div className="doc-list doc-list--desktop" role="region" aria-label="Lista de documentos">
        <table className="doc-table">
          <thead>
            <tr>
              <th scope="col">Documento</th>
              <th scope="col">Tipo</th>
              <th scope="col">Versão</th>
              <th scope="col">Tamanho</th>
              <th scope="col">Atualizado</th>
              <th scope="col">
                <span className="doc-sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const document = entry.document;
              const version = entry.currentVersion;
              if (!document) {
                return (
                  <tr key={entry.link.documentId}>
                    <td colSpan={6} className="doc-table__error">
                      {entry.loadError ?? 'Documento indisponível'}
                    </td>
                  </tr>
                );
              }
              const expanded = expandedId === document.id;
              return (
                <Fragment key={document.id}>
                  <tr className={expanded ? 'doc-table__row--expanded' : undefined}>
                    <td>
                      <span className="doc-table__title">{document.title}</span>
                      {entry.link.linkPurpose ? (
                        <span className="doc-table__purpose">{entry.link.linkPurpose}</span>
                      ) : null}
                    </td>
                    <td>{version ? formatMimeLabel(version.mimeType) : '—'}</td>
                    <td>{document.currentVersionNumber ? `v${document.currentVersionNumber}` : '—'}</td>
                    <td>{version ? formatFileSize(version.byteSize) : '—'}</td>
                    <td>{formatDateTimePtBr(document.updatedAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="doc-button doc-button--ghost"
                        aria-expanded={expanded}
                        onClick={() => void toggleExpanded(document.id)}
                      >
                        {expanded ? 'Ocultar versões' : 'Versões'}
                      </button>
                    </td>
                  </tr>
                  {expanded ? (
                    <tr className="doc-table__versions-row">
                      <td colSpan={6}>{renderVersionPanel(document, version)}</td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="doc-list doc-list--mobile">
        {entries.map((entry) => {
          const document = entry.document;
          const version = entry.currentVersion;
          if (!document) {
            return (
              <li key={entry.link.documentId} className="doc-card doc-card--error">
                {entry.loadError ?? 'Documento indisponível'}
              </li>
            );
          }
          const expanded = expandedId === document.id;
          return (
            <li key={document.id} className="doc-card">
              <div className="doc-card__header">
                <h4 className="doc-card__title">{document.title}</h4>
                {entry.link.linkPurpose ? (
                  <span className="doc-card__purpose">{entry.link.linkPurpose}</span>
                ) : null}
              </div>
              <dl className="doc-card__meta">
                <div>
                  <dt>Tipo</dt>
                  <dd>{version ? formatMimeLabel(version.mimeType) : '—'}</dd>
                </div>
                <div>
                  <dt>Versão</dt>
                  <dd>{document.currentVersionNumber ? `v${document.currentVersionNumber}` : '—'}</dd>
                </div>
                <div>
                  <dt>Tamanho</dt>
                  <dd>{version ? formatFileSize(version.byteSize) : '—'}</dd>
                </div>
              </dl>
              <button
                type="button"
                className="doc-button doc-button--ghost"
                aria-expanded={expanded}
                onClick={() => void toggleExpanded(document.id)}
              >
                {expanded ? 'Ocultar versões' : 'Ver versões'}
              </button>
              {expanded ? renderVersionPanel(document, version) : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}
