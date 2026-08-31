import { HttpStatus } from '@nestjs/common';
import { DOCUMENT_ERROR_CODES } from '../errors/document-error-codes';
import { DocumentHttpException } from '../errors/document-http.exception';

export function documentsAccessDenied(): DocumentHttpException {
  return new DocumentHttpException(
    HttpStatus.FORBIDDEN,
    DOCUMENT_ERROR_CODES.DENIED,
    'Document access denied.',
  );
}

export function documentsAccessNotFound(): DocumentHttpException {
  return new DocumentHttpException(
    HttpStatus.NOT_FOUND,
    DOCUMENT_ERROR_CODES.NOT_FOUND,
    'Document not found.',
  );
}

export function documentsInvalidInput(message = 'A single file upload is required.'): DocumentHttpException {
  return new DocumentHttpException(HttpStatus.BAD_REQUEST, DOCUMENT_ERROR_CODES.INVALID_INPUT, message);
}

export function documentsUnitNotRegistered(): DocumentHttpException {
  return new DocumentHttpException(
    HttpStatus.BAD_REQUEST,
    DOCUMENT_ERROR_CODES.UNIT_NOT_REGISTERED,
    'Unit is not registered.',
  );
}

export function documentsVersionNotFound(): DocumentHttpException {
  return new DocumentHttpException(
    HttpStatus.NOT_FOUND,
    DOCUMENT_ERROR_CODES.VERSION_NOT_FOUND,
    'Document version not found.',
  );
}

export function documentsStorageFailure(): DocumentHttpException {
  return new DocumentHttpException(
    HttpStatus.SERVICE_UNAVAILABLE,
    DOCUMENT_ERROR_CODES.STORAGE_FAILURE,
    'Object storage upload failed.',
  );
}

export function documentsFileValidationError(
  reason: 'INVALID_MIME' | 'INVALID_EXTENSION' | 'MAGIC_BYTES_MISMATCH' | 'FILE_TOO_LARGE',
): DocumentHttpException {
  switch (reason) {
    case 'INVALID_MIME':
      return new DocumentHttpException(
        HttpStatus.BAD_REQUEST,
        DOCUMENT_ERROR_CODES.INVALID_MIME,
        'MIME type is not allowed.',
      );
    case 'INVALID_EXTENSION':
      return new DocumentHttpException(
        HttpStatus.BAD_REQUEST,
        DOCUMENT_ERROR_CODES.INVALID_EXTENSION,
        'File extension does not match MIME type.',
      );
    case 'MAGIC_BYTES_MISMATCH':
      return new DocumentHttpException(
        HttpStatus.BAD_REQUEST,
        DOCUMENT_ERROR_CODES.MAGIC_BYTES_MISMATCH,
        'File content does not match declared MIME type.',
      );
    case 'FILE_TOO_LARGE':
      return new DocumentHttpException(
        HttpStatus.PAYLOAD_TOO_LARGE,
        DOCUMENT_ERROR_CODES.FILE_TOO_LARGE,
        'File exceeds maximum allowed size.',
      );
    default:
      return documentsInvalidInput('Invalid upload.');
  }
}

export function documentsDownloadTokenInvalid(): DocumentHttpException {
  return new DocumentHttpException(
    HttpStatus.FORBIDDEN,
    DOCUMENT_ERROR_CODES.DOWNLOAD_TOKEN_INVALID,
    'Download token is invalid.',
  );
}

export function documentsDownloadTokenExpired(): DocumentHttpException {
  return new DocumentHttpException(
    HttpStatus.FORBIDDEN,
    DOCUMENT_ERROR_CODES.DOWNLOAD_TOKEN_EXPIRED,
    'Download token has expired.',
  );
}

export function documentsMaxVersionsReached(): DocumentHttpException {
  return new DocumentHttpException(
    HttpStatus.CONFLICT,
    DOCUMENT_ERROR_CODES.MAX_VERSIONS_REACHED,
    'Maximum number of document versions reached.',
  );
}
