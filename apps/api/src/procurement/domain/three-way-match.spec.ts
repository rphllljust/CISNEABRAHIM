import { describe, expect, it } from 'vitest';
import {
  THREE_WAY_MATCH_CLASSIFICATIONS,
  THREE_WAY_MATCH_REASONS,
  classifyThreeWayMatch,
} from './three-way-match';

const ORDER_LINE = {
  id: 'line-1',
  orderedQuantity: '100',
  unitAmount: '1',
  lineAmount: '100',
};

function facts(overrides: {
  receivedQuantity?: string;
  receivedUnitAmount?: string;
  receivedAmount?: string;
  invoices?: Array<{ id: string; supplierId: string; totalAmount: string }>;
  receiptLines?: Array<{ spoLineId: string; quantity: string; unitAmount: string; lineAmount: string }>;
}) {
  return {
    orderSupplierId: 'sup-1',
    orderLines: [ORDER_LINE],
    receiptLines:
      overrides.receiptLines ??
      (overrides.receivedQuantity
        ? [
            {
              spoLineId: 'line-1',
              quantity: overrides.receivedQuantity,
              unitAmount: overrides.receivedUnitAmount ?? '1',
              lineAmount: overrides.receivedAmount ?? overrides.receivedQuantity,
            },
          ]
        : []),
    invoices: overrides.invoices ?? [],
  };
}

describe('three-way match domain', () => {
  it('matches only when PO, receipt and invoice agree on quantity, price and amount', () => {
    const result = classifyThreeWayMatch(
      facts({
        receivedQuantity: '100',
        invoices: [{ id: 'inv-1', supplierId: 'sup-1', totalAmount: '100' }],
      }),
    );
    expect(result.classification).toBe(THREE_WAY_MATCH_CLASSIFICATIONS.Matched);
    expect(result.reasons).toEqual([]);
  });

  it('classifies an incomplete receipt with a matching invoice as PARTIAL, never MATCHED', () => {
    const result = classifyThreeWayMatch(
      facts({
        receivedQuantity: '40',
        invoices: [{ id: 'inv-1', supplierId: 'sup-1', totalAmount: '40' }],
      }),
    );
    expect(result.classification).toBe(THREE_WAY_MATCH_CLASSIFICATIONS.Partial);
    expect(result.reasons).toContain(THREE_WAY_MATCH_REASONS.IncompleteReceipt);
  });

  it('does not auto-approve a price or amount divergence', () => {
    const priced = classifyThreeWayMatch(
      facts({
        receivedQuantity: '100',
        invoices: [{ id: 'inv-1', supplierId: 'sup-1', totalAmount: '120' }],
      }),
    );
    expect(priced.classification).toBe(THREE_WAY_MATCH_CLASSIFICATIONS.Divergent);
    expect(priced.reasons).toContain(THREE_WAY_MATCH_REASONS.PriceMismatch);
    expect(priced.reasons).toContain(THREE_WAY_MATCH_REASONS.AmountMismatch);

    const receiptPrice = classifyThreeWayMatch(
      facts({
        receivedQuantity: '100',
        receivedUnitAmount: '2',
        receivedAmount: '200',
        invoices: [{ id: 'inv-1', supplierId: 'sup-1', totalAmount: '200' }],
      }),
    );
    expect(receiptPrice.classification).toBe(THREE_WAY_MATCH_CLASSIFICATIONS.Divergent);
    expect(receiptPrice.reasons).toContain(THREE_WAY_MATCH_REASONS.PriceMismatch);
  });

  it('does not auto-approve a quantity divergence', () => {
    const billedShort = classifyThreeWayMatch(
      facts({
        receivedQuantity: '100',
        invoices: [{ id: 'inv-1', supplierId: 'sup-1', totalAmount: '80' }],
      }),
    );
    expect(billedShort.classification).toBe(THREE_WAY_MATCH_CLASSIFICATIONS.Divergent);
    expect(billedShort.reasons).toContain(THREE_WAY_MATCH_REASONS.QuantityMismatch);

    const billedBeyondReceipt = classifyThreeWayMatch(
      facts({
        receivedQuantity: '40',
        invoices: [{ id: 'inv-1', supplierId: 'sup-1', totalAmount: '100' }],
      }),
    );
    expect(billedBeyondReceipt.classification).toBe(THREE_WAY_MATCH_CLASSIFICATIONS.Divergent);
    expect(billedBeyondReceipt.classification).not.toBe(THREE_WAY_MATCH_CLASSIFICATIONS.Partial);
    expect(billedBeyondReceipt.classification).not.toBe(THREE_WAY_MATCH_CLASSIFICATIONS.Matched);
  });

  it('sends duplicate invoices to REVIEW_REQUIRED instead of MATCHED', () => {
    const result = classifyThreeWayMatch(
      facts({
        receivedQuantity: '100',
        invoices: [
          { id: 'inv-1', supplierId: 'sup-1', totalAmount: '100' },
          { id: 'inv-2', supplierId: 'sup-1', totalAmount: '100' },
        ],
      }),
    );
    expect(result.classification).toBe(THREE_WAY_MATCH_CLASSIFICATIONS.ReviewRequired);
    expect(result.reasons).toContain(THREE_WAY_MATCH_REASONS.DuplicateInvoice);
  });
});
