import { describe, expect, it } from 'vitest';
import { DOCUMENT_CATEGORIES } from './document-categories';
import { minimalPdfBuffer, minimalPngBuffer, validateUploadedFile } from './file-validation';

describe('validateUploadedFile', () => {
  it('accepts a valid PDF with matching extension and magic bytes', async () => {
    const buffer = minimalPdfBuffer();
    const result = await validateUploadedFile({
      buffer,
      filename: 'report.pdf',
      declaredMime: 'application/pdf',
      category: DOCUMENT_CATEGORIES.General,
      maxSizeBytes: buffer.byteLength + 1,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mime).toBe('application/pdf');
      expect(result.sha256).toHaveLength(64);
    }
  });

  it('rejects fake mime when magic bytes do not match', async () => {
    const buffer = Buffer.from('not-a-pdf');
    const result = await validateUploadedFile({
      buffer,
      filename: 'evil.pdf',
      declaredMime: 'application/pdf',
      category: DOCUMENT_CATEGORIES.General,
      maxSizeBytes: 1024,
    });
    expect(result).toEqual({ ok: false, reason: 'MAGIC_BYTES_MISMATCH' });
  });

  it('rejects oversize files', async () => {
    const buffer = minimalPngBuffer();
    const result = await validateUploadedFile({
      buffer,
      filename: 'photo.png',
      declaredMime: 'image/png',
      category: DOCUMENT_CATEGORIES.Evidence,
      maxSizeBytes: buffer.byteLength - 1,
    });
    expect(result).toEqual({ ok: false, reason: 'FILE_TOO_LARGE' });
  });

  it('rejects extension mismatch', async () => {
    const buffer = minimalPdfBuffer();
    const result = await validateUploadedFile({
      buffer,
      filename: 'report.png',
      declaredMime: 'application/pdf',
      category: DOCUMENT_CATEGORIES.General,
      maxSizeBytes: 1024,
    });
    expect(result).toEqual({ ok: false, reason: 'INVALID_EXTENSION' });
  });
});
