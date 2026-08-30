import { describe, expect, it } from 'vitest';
import { DOCUMENT_UPLOAD_LIMITS } from '../types/document.types';
import { validateDocumentFile } from './document-validation';

describe('validateDocumentFile', () => {
  it('accepts allowed pdf files', () => {
    const file = new File(['%PDF'], 'demo.pdf', { type: 'application/pdf' });
    expect(validateDocumentFile(file)).toBeNull();
  });

  it('rejects oversize files', () => {
    const file = new File([new Uint8Array(DOCUMENT_UPLOAD_LIMITS.maxFileSizeBytes + 1)], 'big.pdf', {
      type: 'application/pdf',
    });
    expect(validateDocumentFile(file)).toMatch(/25 MB/);
  });

  it('rejects invalid mime types', () => {
    const file = new File(['text'], 'notes.txt', { type: 'text/plain' });
    expect(validateDocumentFile(file)).toMatch(/não permitido/i);
  });
});
