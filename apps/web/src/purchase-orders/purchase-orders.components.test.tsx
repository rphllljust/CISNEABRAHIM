import { describe, expect, it } from 'vitest';
import { mapPurchaseOrderErrorToMessage } from './api/purchase-order-error-messages';
import { PURCHASE_ORDER_ERROR_CODES } from './types/purchase-order.types';
import {
  formatDate,
  formatMoney,
  formatPurchaseOrderStatus,
} from './utils/purchase-order-labels';
import { PURCHASE_ORDER_STATUSES } from './types/purchase-order.types';

describe('PurchaseOrderStatusBadge labels', () => {
  it('formats status labels in Portuguese', () => {
    expect(formatPurchaseOrderStatus(PURCHASE_ORDER_STATUSES.Draft)).toBe('Rascunho');
    expect(formatPurchaseOrderStatus(PURCHASE_ORDER_STATUSES.Registered)).toBe('Registrado');
  });
});

describe('purchase order error messages', () => {
  it('maps version conflict', () => {
    expect(
      mapPurchaseOrderErrorToMessage(PURCHASE_ORDER_ERROR_CODES.VERSION_CONFLICT, 409),
    ).toMatch(/alterado por outro usuário/i);
  });

  it('maps duplicate PO', () => {
    expect(mapPurchaseOrderErrorToMessage(PURCHASE_ORDER_ERROR_CODES.DUPLICATE, 409)).toMatch(
      /já existe/i,
    );
  });
});

describe('purchase order money formatting', () => {
  it('formats BRL amounts with alignment class support', () => {
    expect(formatMoney('9999.99', 'BRL')).toMatch(/9\.999,99/);
  });
});

describe('purchase order date formatting', () => {
  it('preserves date-only values without UTC timezone drift', () => {
    expect(formatDate('2026-08-21')).toBe('21/08/2026');
  });
});
