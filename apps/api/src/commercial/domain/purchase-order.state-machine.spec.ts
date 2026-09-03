import { describe, expect, it } from 'vitest';
import {
  PURCHASE_ORDER_STATUSES,
  type PurchaseOrderStatus,
  assertTransition,
  canEditDraft,
  canTransition,
  PurchaseOrderStateError,
} from './purchase-order';

describe('purchase-order state machine', () => {
  it('allows draft to registered and cancelled', () => {
    expect(canTransition(PURCHASE_ORDER_STATUSES.Draft, PURCHASE_ORDER_STATUSES.Registered)).toBe(true);
    expect(canTransition(PURCHASE_ORDER_STATUSES.Draft, PURCHASE_ORDER_STATUSES.Cancelled)).toBe(true);
  });

  it('allows registered to cancelled only', () => {
    expect(canTransition(PURCHASE_ORDER_STATUSES.Registered, PURCHASE_ORDER_STATUSES.Cancelled)).toBe(true);
    expect(canTransition(PURCHASE_ORDER_STATUSES.Registered, PURCHASE_ORDER_STATUSES.Registered)).toBe(false);
  });

  it('rejects invalid transitions', () => {
    const invalidPairs: Array<[PurchaseOrderStatus, PurchaseOrderStatus]> = [
      [PURCHASE_ORDER_STATUSES.Draft, PURCHASE_ORDER_STATUSES.Draft],
      [PURCHASE_ORDER_STATUSES.Registered, PURCHASE_ORDER_STATUSES.Draft],
      [PURCHASE_ORDER_STATUSES.Cancelled, PURCHASE_ORDER_STATUSES.Registered],
    ];

    for (const [from, to] of invalidPairs) {
      expect(canTransition(from, to)).toBe(false);
      expect(() => assertTransition(from, to)).toThrow(PurchaseOrderStateError);
    }
  });

  it('allows draft edits only in draft', () => {
    expect(canEditDraft(PURCHASE_ORDER_STATUSES.Draft)).toBe(true);
    expect(canEditDraft(PURCHASE_ORDER_STATUSES.Registered)).toBe(false);
  });
});
