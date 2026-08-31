import { HttpStatus } from '@nestjs/common';
import { REQUESTS_ERROR_CODES } from '../errors/requests-error-codes';
import { RequestsHttpException } from '../errors/requests-http.exception';

export function serviceRequestsAccessDenied(): RequestsHttpException {
  return new RequestsHttpException(HttpStatus.FORBIDDEN, REQUESTS_ERROR_CODES.DENIED, 'Access denied.');
}

export function serviceRequestsAccessNotFound(): RequestsHttpException {
  return new RequestsHttpException(
    HttpStatus.NOT_FOUND,
    REQUESTS_ERROR_CODES.NOT_FOUND,
    'Service request not found.',
  );
}

export function serviceRequestsValidationFailed(): RequestsHttpException {
  return new RequestsHttpException(
    HttpStatus.BAD_REQUEST,
    REQUESTS_ERROR_CODES.VALIDATION_FAILED,
    'Invalid request body.',
  );
}

export function serviceRequestsVersionConflict(): RequestsHttpException {
  return new RequestsHttpException(
    HttpStatus.CONFLICT,
    REQUESTS_ERROR_CODES.VERSION_CONFLICT,
    'Service request was modified by another request.',
  );
}

export function serviceRequestsInvalidState(): RequestsHttpException {
  return new RequestsHttpException(
    HttpStatus.CONFLICT,
    REQUESTS_ERROR_CODES.INVALID_STATE,
    'Service request is not in a valid state for this operation.',
  );
}

export function serviceRequestsConversionNotAllowed(): RequestsHttpException {
  return new RequestsHttpException(
    HttpStatus.CONFLICT,
    REQUESTS_ERROR_CODES.CONVERSION_NOT_ALLOWED,
    'Service request cannot be converted.',
  );
}

export function serviceRequestsClientNotFound(): RequestsHttpException {
  return new RequestsHttpException(
    HttpStatus.NOT_FOUND,
    REQUESTS_ERROR_CODES.CLIENT_NOT_FOUND,
    'Client not found.',
  );
}

export function serviceRequestsClientInactive(): RequestsHttpException {
  return new RequestsHttpException(
    HttpStatus.CONFLICT,
    REQUESTS_ERROR_CODES.CLIENT_INACTIVE,
    'Client is inactive.',
  );
}

export function serviceRequestsServiceNotFound(): RequestsHttpException {
  return new RequestsHttpException(
    HttpStatus.NOT_FOUND,
    REQUESTS_ERROR_CODES.SERVICE_NOT_FOUND,
    'Service definition not found.',
  );
}

export function serviceRequestsDocumentNotFound(): RequestsHttpException {
  return new RequestsHttpException(
    HttpStatus.NOT_FOUND,
    REQUESTS_ERROR_CODES.DOCUMENT_NOT_FOUND,
    'Document not found.',
  );
}

export function serviceRequestsProposalNotFound(): RequestsHttpException {
  return new RequestsHttpException(
    HttpStatus.NOT_FOUND,
    REQUESTS_ERROR_CODES.PROPOSAL_NOT_FOUND,
    'Proposal not found.',
  );
}

export function serviceRequestsPurchaseOrderNotFound(): RequestsHttpException {
  return new RequestsHttpException(
    HttpStatus.NOT_FOUND,
    REQUESTS_ERROR_CODES.PURCHASE_ORDER_NOT_FOUND,
    'Purchase order not found.',
  );
}

export function serviceRequestsPurchaseOrderInvalidState(): RequestsHttpException {
  return new RequestsHttpException(
    HttpStatus.CONFLICT,
    REQUESTS_ERROR_CODES.PURCHASE_ORDER_INVALID_STATE,
    'Purchase order must be registered before linking to a service request.',
  );
}

export function serviceRequestsPurchaseOrderClientMismatch(): RequestsHttpException {
  return new RequestsHttpException(
    HttpStatus.CONFLICT,
    REQUESTS_ERROR_CODES.PURCHASE_ORDER_CLIENT_MISMATCH,
    'Service request client does not match the purchase order client.',
  );
}

export function serviceRequestsDuplicateIdempotency(): RequestsHttpException {
  return new RequestsHttpException(
    HttpStatus.CONFLICT,
    REQUESTS_ERROR_CODES.DUPLICATE_IDEMPOTENCY,
    'Idempotency key already used.',
  );
}

export function serviceRequestsUnitNotRegistered(): RequestsHttpException {
  return new RequestsHttpException(
    HttpStatus.BAD_REQUEST,
    REQUESTS_ERROR_CODES.UNIT_NOT_REGISTERED,
    'Unit is not registered.',
  );
}
