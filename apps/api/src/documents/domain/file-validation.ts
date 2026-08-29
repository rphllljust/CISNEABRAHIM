import { extname } from 'node:path';
import {
  ALLOWED_MIME_TYPES,
  type AllowedMimeType,
  MIME_TO_EXTENSIONS,
  type DocumentCategory,
} from './document-categories';

export type FileValidationInput = {
  buffer: Buffer;
  filename: string;
  declaredMime: string;
  category: DocumentCategory;
  maxSizeBytes: number;
};

export type FileValidationResult =
  | { ok: true; mime: AllowedMimeType; extension: string; sha256: string }
  | { ok: false; reason: 'INVALID_MIME' | 'INVALID_EXTENSION' | 'MAGIC_BYTES_MISMATCH' | 'FILE_TOO_LARGE' };

const MAGIC_SIGNATURES: Record<AllowedMimeType, (buffer: Buffer) => boolean> = {
  'application/pdf': (buffer) => buffer.subarray(0, 4).toString('ascii') === '%PDF',
  'image/jpeg': (buffer) =>
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff,
  'image/png': (buffer) =>
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a,
};

function normalizeMime(value: string): string {
  return value.split(';')[0]?.trim().toLowerCase() ?? '';
}

function normalizeExtension(filename: string): string {
  const ext = extname(filename).replace(/^\./, '').toLowerCase();
  return ext;
}

function isAllowedMime(mime: string): mime is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
}

export async function validateUploadedFile(input: FileValidationInput): Promise<FileValidationResult> {
  if (input.buffer.byteLength > input.maxSizeBytes) {
    return { ok: false, reason: 'FILE_TOO_LARGE' };
  }

  const normalizedMime = normalizeMime(input.declaredMime);
  if (!isAllowedMime(normalizedMime)) {
    return { ok: false, reason: 'INVALID_MIME' };
  }

  const extension = normalizeExtension(input.filename);
  const allowedExtensions = MIME_TO_EXTENSIONS[normalizedMime];
  if (!allowedExtensions.includes(extension)) {
    return { ok: false, reason: 'INVALID_EXTENSION' };
  }

  const magicOk = MAGIC_SIGNATURES[normalizedMime](input.buffer);
  if (!magicOk) {
    return { ok: false, reason: 'MAGIC_BYTES_MISMATCH' };
  }

  const { createHash } = await import('node:crypto');
  const sha256 = createHash('sha256').update(input.buffer).digest('hex');

  void input.category;

  return { ok: true, mime: normalizedMime, extension, sha256 };
}

export function minimalPdfBuffer(): Buffer {
  return Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n');
}

export function minimalPngBuffer(): Buffer {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
    0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f,
    0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00,
    0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
}
