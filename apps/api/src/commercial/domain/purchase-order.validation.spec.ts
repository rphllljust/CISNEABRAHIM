import { describe, expect, it } from 'vitest';
import {
  PURCHASE_ORDER_PRICING_STRUCTURES,
  PURCHASE_ORDER_RULE_TYPES,
} from './purchase-order';
import {
  PurchaseOrderValidationError,
  validateCreatePurchaseOrderInput,
} from './purchase-order.validation';

describe('purchase-order.validation', () => {
  it('validates line item totals for LINE_ITEMS pricing', () => {
    const result = validateCreatePurchaseOrderInput({
      clientId: crypto.randomUUID(),
      unitId: 'unit-a',
      poNumber: '41926266',
      pricingStructure: PURCHASE_ORDER_PRICING_STRUCTURES.LineItems,
      items: [
        {
          lineNumber: 1,
          description: 'Locação',
          quantity: '1.0000',
          unitCode: 'UA',
          unitPrice: '9351.0000',
          lineTotal: '9351.0000',
        },
      ],
    });
    expect(result.items[0]?.lineTotal).toBe('9351.0000');
  });

  it('rejects mismatched line totals', () => {
    expect(() =>
      validateCreatePurchaseOrderInput({
        clientId: crypto.randomUUID(),
        unitId: 'unit-a',
        poNumber: '41926266',
        pricingStructure: PURCHASE_ORDER_PRICING_STRUCTURES.LineItems,
        items: [
          {
            lineNumber: 1,
            description: 'Locação',
            quantity: '1.0000',
            unitPrice: '9351.0000',
            lineTotal: '9000.0000',
          },
        ],
      }),
    ).toThrow(PurchaseOrderValidationError);
  });

  it('requires billing cutoff config for BILLING_CUTOFF rule', () => {
    expect(() =>
      validateCreatePurchaseOrderInput({
        clientId: crypto.randomUUID(),
        unitId: 'unit-a',
        poNumber: '41926266',
        pricingStructure: PURCHASE_ORDER_PRICING_STRUCTURES.HeaderTotal,
        totalAmount: '9351.0000',
        billingRules: [{ ruleType: PURCHASE_ORDER_RULE_TYPES.BillingCutoff, ruleConfig: {} }],
      }),
    ).toThrow(PurchaseOrderValidationError);
  });
});
