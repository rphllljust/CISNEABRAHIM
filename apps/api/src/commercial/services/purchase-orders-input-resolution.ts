import { randomBytes } from 'node:crypto';
import { assertUuid, CatalogValidationError } from '../../catalog/domain/service-catalog.validation';
import {
  PurchaseOrderValidationError,
  validateCancelPurchaseOrderInput,
  validateCreatePurchaseOrderInput,
  validateLinkPurchaseOrderDocumentInput,
  validateRegisterPurchaseOrderInput,
  validateUpdatePurchaseOrderDraftInput,
  type CancelPurchaseOrderInput,
  type CreatePurchaseOrderInput,
  type LinkPurchaseOrderDocumentInput,
  type UpdatePurchaseOrderDraftInput,
} from '../domain/purchase-order.validation';
import { purchaseOrdersAccessNotFound, purchaseOrdersValidationFailed } from './purchase-orders-access.errors';

export function assertValidPurchaseOrderId(purchaseOrderId: string): void {
  try {
    assertUuid(purchaseOrderId);
  } catch (error) {
    if (error instanceof CatalogValidationError) {
      throw purchaseOrdersAccessNotFound();
    }
    throw error;
  }
}

export function generatePurchaseOrderInternalCode(): string {
  return `PO-${new Date().getUTCFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export function resolveCreatePurchaseOrderInput(input: CreatePurchaseOrderInput) {
  try {
    return validateCreatePurchaseOrderInput(input);
  } catch (error) {
    if (error instanceof PurchaseOrderValidationError) {
      throw purchaseOrdersValidationFailed();
    }
    throw error;
  }
}

export function resolveUpdatePurchaseOrderDraftInput(input: UpdatePurchaseOrderDraftInput) {
  try {
    return validateUpdatePurchaseOrderDraftInput(input);
  } catch (error) {
    if (error instanceof PurchaseOrderValidationError) {
      throw purchaseOrdersValidationFailed();
    }
    throw error;
  }
}

export function resolveRegisterPurchaseOrderInput(input: { rowVersion: number }) {
  try {
    return validateRegisterPurchaseOrderInput(input);
  } catch (error) {
    if (error instanceof PurchaseOrderValidationError) {
      throw purchaseOrdersValidationFailed();
    }
    throw error;
  }
}

export function resolveCancelPurchaseOrderInput(input: CancelPurchaseOrderInput) {
  try {
    return validateCancelPurchaseOrderInput(input);
  } catch (error) {
    if (error instanceof PurchaseOrderValidationError) {
      throw purchaseOrdersValidationFailed();
    }
    throw error;
  }
}

export function resolveLinkPurchaseOrderDocumentInput(input: LinkPurchaseOrderDocumentInput) {
  try {
    return validateLinkPurchaseOrderDocumentInput(input);
  } catch (error) {
    if (error instanceof PurchaseOrderValidationError) {
      throw purchaseOrdersValidationFailed();
    }
    throw error;
  }
}
