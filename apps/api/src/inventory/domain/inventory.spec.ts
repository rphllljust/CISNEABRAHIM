import { describe, expect, it } from 'vitest';
import {
  ADJUSTMENT_EFFECTS,
  COSTING_METHOD_STATUSES,
  STOCK_MOVEMENT_TYPES,
  TRANSFER_LEGS,
  assertCostingNotInvented,
  assertCostingUndecided,
  assertNegativeStockUnauthorized,
  assertSufficientStock,
  deriveStockPosition,
  reconcileOnHand,
  signedQuantityForMovement,
} from './inventory';

describe('inventory domain', () => {
  it('keeps InventoryItem quantity math distinct from a physical asset identity', () => {
    expect(STOCK_MOVEMENT_TYPES.In).toBe('IN');
    expect(signedQuantityForMovement({ movementType: 'IN', quantity: '10.0000' })).toBe('10.0000');
    expect(signedQuantityForMovement({ movementType: 'OUT', quantity: '3.0000' })).toBe('-3.0000');
    expect(
      signedQuantityForMovement({
        movementType: 'TRANSFER',
        quantity: '2.0000',
        transferLeg: TRANSFER_LEGS.Origin,
      }),
    ).toBe('-2.0000');
    expect(
      signedQuantityForMovement({
        movementType: 'ADJUSTMENT',
        quantity: '1.0000',
        adjustmentEffect: ADJUSTMENT_EFFECTS.Decrease,
      }),
    ).toBe('-1.0000');
  });

  it('derives available stock from movements minus reservations', () => {
    const position = deriveStockPosition({
      postedSignedQuantities: ['10.0000', '-2.0000'],
      activeReservationQuantities: ['3.0000'],
    });
    expect(position.onHand).toBe('8.0000');
    expect(position.reserved).toBe('3.0000');
    expect(position.available).toBe('5.0000');
  });

  it('forbids overdraw unless negative stock is explicitly allowed', () => {
    expect(() =>
      assertSufficientStock({ available: '4.0000', quantity: '5.0000', allowsNegativeStock: false }),
    ).toThrowError('INVENTORY_INSUFFICIENT_STOCK');
    expect(() =>
      assertSufficientStock({ available: '4.0000', quantity: '5.0000', allowsNegativeStock: true }),
    ).not.toThrow();
    expect(() => assertNegativeStockUnauthorized('-0.0001')).toThrowError('INVENTORY_NEGATIVE_STOCK');
  });

  it('does not invent FIFO or average costing', () => {
    expect(COSTING_METHOD_STATUSES.Undecided).toBe('UNDECIDED');
    expect(() => assertCostingUndecided('UNDECIDED')).not.toThrow();
    expect(() => assertCostingNotInvented()).toThrowError('INVENTORY_COST_METHOD_NOT_DECIDED');
  });

  it('reconciles reported on-hand with posted movement signed quantities', () => {
    expect(reconcileOnHand(['10.0000', '-4.0000', '1.0000'], '7.0000')).toBe(true);
    expect(reconcileOnHand(['10.0000', '-4.0000'], '7.0000')).toBe(false);
  });
});
