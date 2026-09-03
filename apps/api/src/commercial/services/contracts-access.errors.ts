import { HttpStatus } from '@nestjs/common';
import { COMMERCIAL_ERROR_CODES } from '../errors/commercial-error-codes';
import { CommercialHttpException } from '../errors/commercial-http.exception';

export function contractsAccessDenied(): CommercialHttpException {
  return new CommercialHttpException(HttpStatus.FORBIDDEN, COMMERCIAL_ERROR_CODES.DENIED, 'Access denied.');
}

export function contractsAccessNotFound(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.NOT_FOUND,
    COMMERCIAL_ERROR_CODES.CONTRACT_NOT_FOUND,
    'Contract not found.',
  );
}

export function contractsVersionConflict(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.CONFLICT,
    COMMERCIAL_ERROR_CODES.CONTRACT_VERSION_CONFLICT,
    'Contract was modified by another request.',
  );
}

export function contractsInvalidState(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.CONFLICT,
    COMMERCIAL_ERROR_CODES.CONTRACT_INVALID_STATE,
    'Contract is not in a valid state for this operation.',
  );
}

export function contractsValidationFailed(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.BAD_REQUEST,
    COMMERCIAL_ERROR_CODES.VALIDATION_FAILED,
    'Invalid request body.',
  );
}

export function contractsClientNotFound(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.NOT_FOUND,
    COMMERCIAL_ERROR_CODES.CLIENT_NOT_FOUND,
    'Client not found.',
  );
}

export function contractsServiceNotFound(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.NOT_FOUND,
    COMMERCIAL_ERROR_CODES.SERVICE_NOT_FOUND,
    'Service definition not found.',
  );
}

export function contractsDocumentNotFound(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.NOT_FOUND,
    COMMERCIAL_ERROR_CODES.DOCUMENT_NOT_FOUND,
    'Document not found.',
  );
}

export function contractsDuplicate(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.CONFLICT,
    COMMERCIAL_ERROR_CODES.CONTRACT_DUPLICATE,
    'Contract number already exists for this client.',
  );
}

export function contractsClientMismatch(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.CONFLICT,
    COMMERCIAL_ERROR_CODES.CONTRACT_CLIENT_MISMATCH,
    'Contract does not belong to the specified client.',
  );
}

export function contractsNotActive(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.CONFLICT,
    COMMERCIAL_ERROR_CODES.CONTRACT_NOT_ACTIVE,
    'Contract is not active.',
  );
}

export function contractsNotYetValid(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.CONFLICT,
    COMMERCIAL_ERROR_CODES.CONTRACT_NOT_YET_VALID,
    'Contract is not yet valid.',
  );
}

export function contractsExpired(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.CONFLICT,
    COMMERCIAL_ERROR_CODES.CONTRACT_EXPIRED,
    'Contract has expired.',
  );
}

export function contractsClosed(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.CONFLICT,
    COMMERCIAL_ERROR_CODES.CONTRACT_CLOSED,
    'Contract is closed.',
  );
}

export function isDuplicateContractViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const pgError = error as { code?: string; constraint?: string };
  return (
    pgError.code === '23505' &&
    (pgError.constraint?.includes('client_contract_number') ?? false)
  );
}
