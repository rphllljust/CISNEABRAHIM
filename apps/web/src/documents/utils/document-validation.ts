import { DOCUMENT_UPLOAD_LIMITS } from '../types/document.types';

export function validateDocumentFile(file: File): string | null {
  if (file.size > DOCUMENT_UPLOAD_LIMITS.maxFileSizeBytes) {
    return 'Arquivo excede 25 MB.';
  }
  const mime = file.type || 'application/octet-stream';
  if (!(DOCUMENT_UPLOAD_LIMITS.allowedMimeTypes as readonly string[]).includes(mime)) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !(DOCUMENT_UPLOAD_LIMITS.allowedExtensions as readonly string[]).includes(extension)) {
      return 'Tipo de arquivo não permitido. Use PDF, JPEG ou PNG.';
    }
  }
  return null;
}
