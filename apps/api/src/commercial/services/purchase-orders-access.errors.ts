import { HttpStatus } from '@nestjs/common';
import { COMMERCIAL_ERROR_CODES } from '../errors/commercial-error-codes';
import { CommercialHttpException } from '../errors/commercial-http.exception';

export function purchaseOrdersAccessDenied(): CommercialHttpException {
  return new CommercialHttpException(HttpStatus.FORBIDDEN, COMMERCIAL_ERROR_CODES.DENIED, 'Access denied.');
}

export function purchaseOrdersAccessNotFound(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.NOT_FOUND,
    COMMERCIAL_ERROR_CODES.PURCHASE_ORDER_NOT_FOUND,
    'Purchase order not found.',
  );
}

export function purchaseOrdersVersionConflict(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.CONFLICT,
    COMMERCIAL_ERROR_CODES.PURCHASE_ORDER_VERSION_CONFLICT,
    'Purchase order was modified by another request.',
  );
}

export function purchaseOrdersOverrunJustificationRequired(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.BAD_REQUEST,
    COMMERCIAL_ERROR_CODES.PURCHASE_ORDER_OVERRUN_JUSTIFICATION_REQUIRED,
    'Administrative purchase order overrun requires a justification.',
  );
}

export function purchaseOrdersOverrunAmountRequired(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.BAD_REQUEST,
    COMMERCIAL_ERROR_CODES.PURCHASE_ORDER_OVERRUN_AMOUNT_REQUIRED,
    'Administrative purchase order overrun requires a positive amount.',
  );
}

export function purchaseOrdersInvalidState(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.CONFLICT,
    COMMERCIAL_ERROR_CODES.PURCHASE_ORDER_INVALID_STATE,
    'Purchase order is not in a valid state for this operation.',
  );
}

export function purchaseOrdersValidationFailed(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.BAD_REQUEST,
    COMMERCIAL_ERROR_CODES.VALIDATION_FAILED,
    'Invalid request body.',
  );
}

export function purchaseOrdersClientNotFound(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.NOT_FOUND,
    COMMERCIAL_ERROR_CODES.CLIENT_NOT_FOUND,
    'Client not found.',
  );
}

export function purchaseOrdersServiceNotFound(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.NOT_FOUND,
    COMMERCIAL_ERROR_CODES.SERVICE_NOT_FOUND,
    'Service definition not found.',
  );
}

export function purchaseOrdersDocumentNotFound(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.NOT_FOUND,
    COMMERCIAL_ERROR_CODES.DOCUMENT_NOT_FOUND,
    'Document not found.',
  );
}

export function purchaseOrdersInUse(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.CONFLICT,
    COMMERCIAL_ERROR_CODES.PURCHASE_ORDER_IN_USE,
    'Purchase order is linked to active service requests or service orders.',
  );
}

export function purchaseOrdersDuplicatePo(): CommercialHttpException {
  return new CommercialHttpException(
    HttpStatus.CONFLICT,
    COMMERCIAL_ERROR_CODES.PURCHASE_ORDER_DUPLICATE,
    'Purchase order number already exists for this client.',
  );
}

export function isDuplicatePoViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const pgError = error as { code?: string; constraint?: string };
  return pgError.code === '23505' && (pgError.constraint?.includes('client_po_number') ?? false);
}
