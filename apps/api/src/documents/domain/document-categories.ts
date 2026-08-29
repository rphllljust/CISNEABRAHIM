export const DOCUMENT_CATEGORIES = {
  General: 'GENERAL',
  Evidence: 'EVIDENCE',
} as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[keyof typeof DOCUMENT_CATEGORIES];

const CATEGORY_SET = new Set<string>(Object.values(DOCUMENT_CATEGORIES));

export function isDocumentCategory(value: string): value is DocumentCategory {
  return CATEGORY_SET.has(value);
}

export const DOCUMENT_CLASSIFICATIONS = {
  Internal: 'INTERNAL',
  Restricted: 'RESTRICTED',
} as const;

export type DocumentClassification =
  (typeof DOCUMENT_CLASSIFICATIONS)[keyof typeof DOCUMENT_CLASSIFICATIONS];

const CLASSIFICATION_SET = new Set<string>(Object.values(DOCUMENT_CLASSIFICATIONS));

export function isDocumentClassification(value: string): value is DocumentClassification {
  return CLASSIFICATION_SET.has(value);
}

export const DOCUMENT_STATUSES = {
  Active: 'ACTIVE',
  Archived: 'ARCHIVED',
} as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[keyof typeof DOCUMENT_STATUSES];

export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MIME_TO_EXTENSIONS: Record<AllowedMimeType, readonly string[]> = {
  'application/pdf': ['pdf'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
};

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_VERSIONS_PER_DOCUMENT = 50;
