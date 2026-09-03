import { describe, expect, it } from 'vitest';
import { COSTING_METHOD_STATUSES } from './inventory';
import {
  STOCK_ORIGINS,
  applyExplicitCosting,
  multiplyQuantityByUnitCost,
  originForMovement,
  publishedWindowsOverlap,
  reconcileExplicitCosts,
} from './costing';

describe('inventory costing', () => {
  it('multiplies quantity by explicit unit cost without inventing FIFO or average', () => {
    expect(multiplyQuantityByUnitCost('10.0000', '2.5000')).toBe('25.0000');
    expect(
      applyExplicitCosting({
        method: COSTING_METHOD_STATUSES.Undecided,
        quantity: '4.0000',
        unitCost: '3.2500',
        costingRuleVersionId: 'rule-v1',
      }),
    ).toEqual({
      unitCost: '3.2500',
      totalCost: '13.0000',
      costingRuleVersionId: 'rule-v1',
      method: 'UNDECIDED',
    });
  });

  it('allows quantity-only snapshots when unit cost is absent', () => {
    expect(
      applyExplicitCosting({
        method: COSTING_METHOD_STATUSES.Undecided,
        quantity: '2.0000',
        costingRuleVersionId: null,
      }).unitCost,
    ).toBeNull();
  });

  it('refuses invented costing methods', () => {
    expect(() =>
      applyExplicitCosting({
        method: 'FIFO',
        quantity: '1.0000',
        unitCost: '1.0000',
        costingRuleVersionId: 'v',
      }),
    ).toThrowError('INVENTORY_COST_METHOD_NOT_DECIDED');
    expect(() =>
      applyExplicitCosting({
        method: 'AVERAGE',
        quantity: '1.0000',
        unitCost: '1.0000',
        costingRuleVersionId: 'v',
      }),
    ).toThrowError('INVENTORY_COST_METHOD_NOT_DECIDED');
  });

  it('classifies movement origin and reconciles stored explicit cost', () => {
    expect(originForMovement({ movementType: 'IN' })).toBe(STOCK_ORIGINS.Receipt);
    expect(originForMovement({ movementType: 'OUT' })).toBe(STOCK_ORIGINS.Issue);
    expect(
      originForMovement({ movementType: 'IN', reversalOfMovementId: 'm1' }),
    ).toBe(STOCK_ORIGINS.Reversal);
    expect(
      reconcileExplicitCosts([
        { quantity: '2.0000', unitCost: '5.0000', totalCost: '10.0000' },
        { quantity: '1.0000', unitCost: null, totalCost: null },
      ]),
    ).toBe(true);
    expect(
      reconcileExplicitCosts([{ quantity: '2.0000', unitCost: '5.0000', totalCost: '9.0000' }]),
    ).toBe(false);
  });

  it('detects overlapping published costing windows', () => {
    expect(
      publishedWindowsOverlap(
        { effectiveFrom: '2026-01-01', effectiveTo: '2026-06-30' },
        { effectiveFrom: '2026-06-30', effectiveTo: null },
      ),
    ).toBe(true);
    expect(
      publishedWindowsOverlap(
        { effectiveFrom: '2026-01-01', effectiveTo: '2026-03-31' },
        { effectiveFrom: '2026-04-01', effectiveTo: null },
      ),
    ).toBe(false);
  });
});
