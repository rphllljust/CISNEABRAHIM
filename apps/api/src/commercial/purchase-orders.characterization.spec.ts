import { HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { COMMERCIAL_ERROR_CODES } from './errors/commercial-error-codes';
import { CommercialHttpException } from './errors/commercial-http.exception';
import {
  isDuplicatePoViolation,
  purchaseOrdersAccessDenied,
  purchaseOrdersAccessNotFound,
  purchaseOrdersVersionConflict,
} from './services/purchase-orders-access.errors';
import { assertValidPurchaseOrderId } from './services/purchase-orders-input-resolution';

describe('Commercial purchase orders characterization (unit)', () => {
  it('maps authz denial to FORBIDDEN DENIED', () => {
    const error = purchaseOrdersAccessDenied();
    expect(error).toBeInstanceOf(CommercialHttpException);
    expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN);
    expect(error.getResponse()).toMatchObject({ error: { code: COMMERCIAL_ERROR_CODES.DENIED } });
  });

  it('maps missing purchase order to PURCHASE_ORDER_NOT_FOUND', () => {
    const error = purchaseOrdersAccessNotFound();
    expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(error.getResponse()).toMatchObject({
      error: { code: COMMERCIAL_ERROR_CODES.PURCHASE_ORDER_NOT_FOUND },
    });
  });

  it('maps optimistic concurrency to PURCHASE_ORDER_VERSION_CONFLICT', () => {
    const error = purchaseOrdersVersionConflict();
    expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(error.getResponse()).toMatchObject({
      error: { code: COMMERCIAL_ERROR_CODES.PURCHASE_ORDER_VERSION_CONFLICT },
    });
  });

  it('detects duplicate PO PostgreSQL violations', () => {
    expect(isDuplicatePoViolation({ code: '23505', constraint: 'client_po_number_unique' })).toBe(true);
    expect(isDuplicatePoViolation({ code: '23505', constraint: 'other_unique' })).toBe(false);
    expect(isDuplicatePoViolation(null)).toBe(false);
  });

  it('treats invalid purchase order UUID as not found without leaking validation detail', () => {
    expect(() => assertValidPurchaseOrderId('not-a-uuid')).toThrow(CommercialHttpException);
    try {
      assertValidPurchaseOrderId('not-a-uuid');
    } catch (error) {
      const httpError = error as CommercialHttpException;
      expect(httpError.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(httpError.getResponse()).toMatchObject({
        error: { code: COMMERCIAL_ERROR_CODES.PURCHASE_ORDER_NOT_FOUND },
      });
    }
  });
});

// Integration baseline: apps/api/src/commercial/purchase-orders.integration.spec.ts
