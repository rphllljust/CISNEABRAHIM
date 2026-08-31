import { describe, expect, it } from 'vitest';
import { PURCHASE_ORDER_PRICING_STRUCTURES } from './purchase-order';
import {
  assertPurchaseOrderConsumptionAllowed,
  computePurchaseOrderAvailableBalance,
  PurchaseOrderBalanceError,
  resolvePurchaseOrderAuthorizedAmount,
} from './purchase-order-balance';

describe('purchase-order-balance', () => {
  it('resolves authorized amount from header total', () => {
    expect(
      resolvePurchaseOrderAuthorizedAmount({
        pricingStructure: PURCHASE_ORDER_PRICING_STRUCTURES.HeaderTotal,
        totalAmount: '9351.0000',
        lineTotals: [],
        consumedAmount: '0',
      }),
    ).toBe('9351.0000');
  });

  it('resolves authorized amount from line totals', () => {
    expect(
      resolvePurchaseOrderAuthorizedAmount({
        pricingStructure: PURCHASE_ORDER_PRICING_STRUCTURES.LineItems,
        totalAmount: null,
        lineTotals: ['1000.0000', '250.5000'],
        consumedAmount: '0',
      }),
    ).toBe('1250.5');
  });

  it('computes available balance after consumption', () => {
    expect(
      computePurchaseOrderAvailableBalance({
        pricingStructure: PURCHASE_ORDER_PRICING_STRUCTURES.HeaderTotal,
        totalAmount: '1000.0000',
        lineTotals: [],
        consumedAmount: '250.0000',
      }),
    ).toBe('750');
  });

  it('rejects consumption above authorized balance', () => {
    expect(() =>
      assertPurchaseOrderConsumptionAllowed(
        {
          pricingStructure: PURCHASE_ORDER_PRICING_STRUCTURES.HeaderTotal,
          totalAmount: '1000.0000',
          lineTotals: [],
          consumedAmount: '900.0000',
        },
        '200.0000',
      ),
    ).toThrow(PurchaseOrderBalanceError);
  });
});