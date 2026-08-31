import { HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { DOCUMENT_ERROR_CODES } from './errors/document-error-codes';
import { DocumentHttpException } from './errors/document-http.exception';
import {
  documentsAccessDenied,
  documentsAccessNotFound,
  documentsFileValidationError,
} from './services/documents-access.errors';
import { assertValidDocumentId } from './services/documents-input-resolution';

describe('Documents characterization (unit)', () => {
  it('maps authz denial to FORBIDDEN DENIED', () => {
    const error = documentsAccessDenied();
    expect(error).toBeInstanceOf(DocumentHttpException);
    expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN);
    expect(error.getResponse()).toMatchObject({ error: { code: DOCUMENT_ERROR_CODES.DENIED } });
  });

  it('maps missing document to NOT_FOUND', () => {
    const error = documentsAccessNotFound();
    expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(error.getResponse()).toMatchObject({ error: { code: DOCUMENT_ERROR_CODES.NOT_FOUND } });
  });

  it('maps file validation reasons to stable error codes', () => {
    const error = documentsFileValidationError('FILE_TOO_LARGE');
    expect(error.getStatus()).toBe(HttpStatus.PAYLOAD_TOO_LARGE);
    expect(error.getResponse()).toMatchObject({ error: { code: DOCUMENT_ERROR_CODES.FILE_TOO_LARGE } });
  });

  it('treats invalid document UUID as not found without leaking validation detail', () => {
    expect(() => assertValidDocumentId('not-a-uuid')).toThrow(DocumentHttpException);
    try {
      assertValidDocumentId('not-a-uuid');
    } catch (error) {
      const httpError = error as DocumentHttpException;
      expect(httpError.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(httpError.getResponse()).toMatchObject({ error: { code: DOCUMENT_ERROR_CODES.NOT_FOUND } });
    }
  });
});
