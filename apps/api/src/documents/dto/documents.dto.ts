import {
  isDocumentCategory,
  isDocumentClassification,
  MAX_FILE_SIZE_BYTES,
  MAX_VERSIONS_PER_DOCUMENT,
} from '../domain/document-categories';

export type CreateDocumentUploadInput = {
  title: string;
  categoryCode: import('../domain/document-categories').DocumentCategory;
  classificationCode: string;
  unitId: string;
};

export type ListDocumentsQuery = {
  unitId?: string;
  categoryCode?: string;
  limit: number;
  offset: number;
};

export type UploadedFileInput = {
  buffer: Buffer;
  filename: string;
  mimetype: string;
};

export function parseCreateDocumentUploadFields(
  fields: Record<string, string | undefined>,
): CreateDocumentUploadInput {
  const title = fields['title']?.trim();
  const categoryCode = fields['categoryCode']?.trim() ?? '';
  const classificationCode = fields['classificationCode']?.trim() ?? 'INTERNAL';
  const unitId = fields['unitId']?.trim() ?? '';

  if (!title) {
    throw new Error('title is required');
  }
  if (!isDocumentCategory(categoryCode)) {
    throw new Error('categoryCode is invalid');
  }
  if (!isDocumentClassification(classificationCode)) {
    throw new Error('classificationCode is invalid');
  }
  if (!unitId) {
    throw new Error('unitId is required');
  }

  return { title, categoryCode, classificationCode, unitId };
}

export function parseListDocumentsQuery(query: Record<string, unknown>): ListDocumentsQuery {
  const limitRaw = Number(query['limit'] ?? 20);
  const offsetRaw = Number(query['offset'] ?? 0);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20;
  const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;
  const unitId = typeof query['unitId'] === 'string' ? query['unitId'].trim() : undefined;
  const categoryCode =
    typeof query['categoryCode'] === 'string' ? query['categoryCode'].trim() : undefined;

  return { unitId, categoryCode, limit, offset };
}

export function parseVersionNumberParam(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error('versionNumber is invalid');
  }
  return parsed;
}

export const DOCUMENT_UPLOAD_LIMITS = {
  maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
  maxVersionsPerDocument: MAX_VERSIONS_PER_DOCUMENT,
  maxFilesPerRequest: 1,
};
