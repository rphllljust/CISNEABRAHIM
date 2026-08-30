import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import {
  createDocument,
  DocumentsApiError,
  getDocument,
  listDocumentVersions,
  uploadDocumentVersion,
} from '../api/documents-api';
import { mapDocumentErrorToMessage } from '../api/document-error-messages';
import { useDocumentCapabilities } from '../hooks/useDocumentCapabilities';
import type { DocumentCategory, DocumentClassification, DocumentDetail, DocumentLinkRef, DocumentScopeContext, DocumentVersion } from '../types/document.types';
import {
  defaultCategoryForScope,
  defaultClassificationForScope,
  defaultLinkPurposeForScope,
  linkDocumentToScope,
  scopeSupportsEntityLink,
} from '../utils/document-scope';
import { labelForDocumentScope } from '../utils/document-format';
import { validateDocumentFile } from '../utils/document-validation';
import { DocumentList, type DocumentListEntry } from './DocumentList';
import { DocumentUpload } from './DocumentUpload';

type DocumentManagementPanelProps = {
  scope: DocumentScopeContext;
  links: DocumentLinkRef[];
  onLinksChange?: (links: DocumentLinkRef[]) => void;
};

type LoadedEntry = DocumentListEntry & {
  document: DocumentDetail | null;
};

export function DocumentManagementPanel({
  scope,
  links,
  onLinksChange,
}: DocumentManagementPanelProps) {
  const headingId = useId();
  const { capabilities, loading: capabilitiesLoading } = useDocumentCapabilities();
  const [entries, setEntries] = useState<LoadedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ tone: 'error' | 'success'; message: string } | null>(null);
  const [versionUploadingId, setVersionUploadingId] = useState<string | null>(null);

  const scopeLabel = useMemo(() => labelForDocumentScope(scope.kind), [scope.kind]);
  const canLink = scopeSupportsEntityLink(scope.kind);
  const canUpload = capabilities.canCreate && canLink && !capabilitiesLoading;
  const canDownload = capabilities.canDownload && !capabilitiesLoading;
  const canUploadVersion = capabilities.canUploadVersion && !capabilitiesLoading;

  const reloadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await Promise.all(
        links.map(async (link): Promise<LoadedEntry> => {
          try {
            const document = await getDocument(link.documentId);
            let currentVersion: DocumentVersion | null = null;
            if (document.currentVersionNumber) {
              const versions = await listDocumentVersions(document.id);
              currentVersion =
                versions.find((version) => version.isCurrent) ??
                versions.find((version) => version.versionNumber === document.currentVersionNumber) ??
                null;
            }
            return { link, document, currentVersion };
          } catch (error) {
            return {
              link,
              document: null,
              currentVersion: null,
              loadError:
                error instanceof DocumentsApiError
                  ? mapDocumentErrorToMessage(error.code, error.status)
                  : 'Não foi possível carregar o documento.',
            };
          }
        }),
      );
      setEntries(loaded);
    } finally {
      setLoading(false);
    }
  }, [links]);

  useEffect(() => {
    void reloadDocuments();
  }, [reloadDocuments]);

  const handleUpload = async (file: File, onProgress: (progress: number) => void) => {
    setFeedback(null);
    const validationError = validateDocumentFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    try {
      const title = file.name.replace(/\.[^.]+$/, '') || file.name;
      const created = await createDocument(
        {
          title,
          categoryCode: defaultCategoryForScope(scope) as DocumentCategory,
          classificationCode: defaultClassificationForScope(scope) as DocumentClassification,
          unitId: scope.unitId,
        },
        file,
        onProgress,
      );

      if (!canLink) {
        throw new Error('Vinculação indisponível para este escopo.');
      }

      const updatedLinks = await linkDocumentToScope(
        scope,
        created.document.id,
        defaultLinkPurposeForScope(scope),
      );
      onLinksChange?.(updatedLinks);
      setFeedback({ tone: 'success', message: 'Documento enviado e vinculado com sucesso.' });
    } catch (error) {
      if (error instanceof DocumentsApiError) {
        throw new Error(mapDocumentErrorToMessage(error.code, error.status));
      }
      throw error;
    }
  };

  const handleExpandVersions = async (documentId: string) => listDocumentVersions(documentId);

  const handleUploadNewVersion = async (documentId: string, file: File) => {
    setFeedback(null);
    const validationError = validateDocumentFile(file);
    if (validationError) {
      setFeedback({ tone: 'error', message: validationError });
      return;
    }
    setVersionUploadingId(documentId);
    try {
      await uploadDocumentVersion(documentId, file, () => undefined);
      setFeedback({
        tone: 'success',
        message: 'Nova versão publicada. Versões anteriores permanecem no histórico.',
      });
      await reloadDocuments();
    } catch (error) {
      setFeedback({
        tone: 'error',
        message:
          error instanceof DocumentsApiError
            ? mapDocumentErrorToMessage(error.code, error.status)
            : 'Não foi possível enviar a nova versão.',
      });
    } finally {
      setVersionUploadingId(null);
    }
  };

  if (capabilitiesLoading) {
    return <p aria-busy="true">Carregando permissões de documentos…</p>;
  }

  if (!capabilities.canRead && !capabilities.canCreate) {
    return (
      <section className="doc-panel" aria-labelledby={headingId}>
        <h2 id={headingId}>Documentos</h2>
        <p role="alert">Você não tem permissão para visualizar documentos neste escopo.</p>
      </section>
    );
  }

  return (
    <section className="doc-panel" aria-labelledby={headingId}>
      <header className="doc-panel__header">
        <h2 id={headingId}>Documentos</h2>
        <p className="doc-panel__meta">
          {scopeLabel}
          {scope.entityLabel ? ` · ${scope.entityLabel}` : ''}
        </p>
        <p className="doc-panel__security-note">
          Downloads apenas por endpoints autorizados. Chaves internas de armazenamento nunca são exibidas.
        </p>
      </header>

      {feedback ? (
        <p
          className={`doc-feedback doc-feedback--${feedback.tone}`}
          role={feedback.tone === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </p>
      ) : null}

      {loading ? (
        <p aria-busy="true">Carregando documentos…</p>
      ) : (
        <DocumentList
          scopeLabel={scopeLabel}
          entries={entries}
          canDownload={canDownload}
          canUploadVersion={canUploadVersion}
          onExpand={handleExpandVersions}
          onUploadNewVersion={canUploadVersion ? handleUploadNewVersion : undefined}
          versionUploadingId={versionUploadingId}
        />
      )}

      {canUpload ? (
        <DocumentUpload disabled={!canUpload} onUpload={handleUpload} />
      ) : canLink ? null : (
        <p className="doc-panel__readonly-note">
          Envio de novos documentos não está disponível para este tipo de registro na interface atual.
          Documentos existentes podem ser consultados quando vinculados.
        </p>
      )}
    </section>
  );
}
