import type { DocumentRow, DocumentVersionRow } from '../repositories/documents.repository';

export type DocumentResponse = {
  id: string;
  title: string;
  categoryCode: string;
  classificationCode: string;
  status: string;
  unitId: string;
  currentVersionNumber: number | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentVersionResponse = {
  id: string;
  documentId: string;
  versionNumber: number;
  originalFilename: string;
  mimeType: string;
  byteSize: number;
  sha256Hash: string;
  uploadedByIdentityId: string;
  publishedAt: string;
  supersededAt: string | null;
  isCurrent: boolean;
};

export function toDocumentResponse(row: DocumentRow): DocumentResponse {
  return {
    id: row.id,
    title: row.title,
    categoryCode: row.category_code,
    classificationCode: row.classification_code,
    status: row.status,
    unitId: row.unit_id,
    currentVersionNumber: row.current_version_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toDocumentVersionResponse(
  row: DocumentVersionRow,
  currentVersionNumber: number | null,
): DocumentVersionResponse {
  return {
    id: row.id,
    documentId: row.document_id,
    versionNumber: row.version_number,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    byteSize: row.byte_size,
    sha256Hash: row.sha256_hash,
    uploadedByIdentityId: row.uploaded_by_identity_id,
    publishedAt: row.published_at,
    supersededAt: row.superseded_at,
    isCurrent: currentVersionNumber !== null && row.version_number === currentVersionNumber,
  };
}

export function assertNoStorageKeyLeak(value: unknown): void {
  if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (key.toLowerCase().includes('storage_key') || key.toLowerCase() === 'storagekey') {
        throw new Error(`Storage key leaked in response field: ${key}`);
      }
      assertNoStorageKeyLeak(nested);
    }
  }
}
