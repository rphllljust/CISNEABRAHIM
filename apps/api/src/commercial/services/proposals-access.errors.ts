import { HttpStatus } from '@nestjs/common';
import { COMMERCIAL_ERROR_CODES } from '../errors/commercial-error-codes';
import { CommercialHttpException } from '../errors/commercial-http.exception';

export function proposalsAccessDenied(): CommercialHttpException {
  return new CommercialHttpException(HttpStatus.FORBIDDEN, COMMERCIAL_ERROR_CODES.DENIED, 'Access denied.');
}

export function proposalsAccessNotFound(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.NOT_FOUND,
    COMMERCIAL_ERROR_CODES.NOT_FOUND,
    'Proposal not found.',
  );
}

export function proposalsVersionConflict(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.CONFLICT,
    COMMERCIAL_ERROR_CODES.VERSION_CONFLICT,
    'Proposal version conflict.',
  );
}

export function proposalsInvalidState(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.CONFLICT,
    COMMERCIAL_ERROR_CODES.INVALID_STATE,
    'Proposal is not in a valid state for this operation.',
  );
}

export function proposalsValidationFailed(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.BAD_REQUEST,
    COMMERCIAL_ERROR_CODES.VALIDATION_FAILED,
    'Invalid request body.',
  );
}

export function proposalsClientNotFound(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.BAD_REQUEST,
    COMMERCIAL_ERROR_CODES.CLIENT_NOT_FOUND,
    'Client not found.',
  );
}

export function proposalsServiceNotFound(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.BAD_REQUEST,
    COMMERCIAL_ERROR_CODES.SERVICE_NOT_FOUND,
    'Service definition not found.',
  );
}

export function proposalsDocumentNotFound(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.BAD_REQUEST,
    COMMERCIAL_ERROR_CODES.DOCUMENT_NOT_FOUND,
    'Document not found.',
  );
}

export function proposalsVersionNotFound(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.NOT_FOUND,
    COMMERCIAL_ERROR_CODES.VERSION_NOT_FOUND,
    'Proposal version not found.',
  );
}
