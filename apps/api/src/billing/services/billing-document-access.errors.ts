import { HttpStatus } from '@nestjs/common';
import { BillingError } from '../domain/billing';
import { PurchaseOrderBillingComplianceError } from '../domain/purchase-order-billing-compliance';
import { BILLING_ERROR_CODES } from '../errors/billing-error-codes';
import { BillingHttpException } from '../errors/billing-http.exception';

export function billingDocumentAccessDenied(): BillingHttpException {
  return new BillingHttpException(HttpStatus.FORBIDDEN, BILLING_ERROR_CODES.DENIED, 'Access denied.');
}

export function billingDocumentAccessNotFound(): BillingHttpException {
  return new BillingHttpException(
    HttpStatus.NOT_FOUND,
    BILLING_ERROR_CODES.NOT_FOUND,
    'Billing record not found.',
  );
}

export function billingDocumentNotFound(): BillingHttpException {
  return new BillingHttpException(
    HttpStatus.NOT_FOUND,
    BILLING_ERROR_CODES.BILLING_DOCUMENT_NOT_FOUND,
    'Billing document not found.',
  );
}

export function billingDocumentServiceOrderNotFound(): BillingHttpException {
  return new BillingHttpException(
    HttpStatus.NOT_FOUND,
    BILLING_ERROR_CODES.SERVICE_ORDER_NOT_FOUND,
    'Service order not found.',
  );
}

export function billingDocumentValidationFailed(): BillingHttpException {
  return new BillingHttpException(
    HttpStatus.BAD_REQUEST,
    BILLING_ERROR_CODES.VALIDATION_FAILED,
    'Invalid billing document request.',
  );
}

export function mapBillingDomainError(error: unknown): BillingHttpException {
  if (!(error instanceof BillingError)) {
    return new BillingHttpException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      BILLING_ERROR_CODES.VALIDATION_FAILED,
      'Unexpected billing error.',
    );
  }
  return new BillingHttpException(
    HttpStatus.CONFLICT,
    BILLING_ERROR_CODES.INVALID_STATE,
    'Billing operation is not allowed.',
  );
}

export function mapPurchaseOrderBillingComplianceError(error: unknown): BillingHttpException | null {
  if (!(error instanceof PurchaseOrderBillingComplianceError)) {
    return null;
  }

  return new BillingHttpException(
    HttpStatus.CONFLICT,
    BILLING_ERROR_CODES.PURCHASE_ORDER_BILLING_RULE_VIOLATED,
    'Purchase order billing rules were not satisfied for document issuance.',
  );
}

export function mapBillingDocumentRepositoryError(error: unknown): BillingHttpException {
  const message = error instanceof Error ? error.message : String(error);
  switch (message) {
    case 'BILLING_DOCUMENT_ALREADY_EXISTS':
      return new BillingHttpException(
        HttpStatus.CONFLICT,
        BILLING_ERROR_CODES.BILLING_DOCUMENT_ALREADY_EXISTS,
        'An active billing document already exists for this billing record.',
      );
    case 'BILLING_DOCUMENT_NOT_FOUND':
      return billingDocumentNotFound();
    case 'BILLING_DOCUMENT_INVALID_STATE':
      return new BillingHttpException(
        HttpStatus.CONFLICT,
        BILLING_ERROR_CODES.BILLING_DOCUMENT_INVALID_STATE,
        'Billing document state does not allow this operation.',
      );
    case 'BILLING_DOCUMENT_IMMUTABLE':
      return new BillingHttpException(
        HttpStatus.CONFLICT,
        BILLING_ERROR_CODES.BILLING_DOCUMENT_IMMUTABLE,
        'Finalized billing documents cannot be modified.',
      );
    case 'BILLING_VERSION_CONFLICT':
      return new BillingHttpException(
        HttpStatus.CONFLICT,
        BILLING_ERROR_CODES.VERSION_CONFLICT,
        'Billing document version conflict.',
      );
    default:
      return new BillingHttpException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        BILLING_ERROR_CODES.VALIDATION_FAILED,
        'Billing document operation failed.',
      );
  }
}
