import { describe, expect, it } from 'vitest';
import {
  assertBillingItemsTraceable,
  BillingInvariantError,
  buildBillingOriginSnapshot,
} from './billing-invariants';

describe('billing-invariants', () => {
  it('builds auditable billing origin snapshot', () => {
    const snapshot = buildBillingOriginSnapshot({
      serviceOrderId: 'so-1',
      measurementId: 'msr-1',
      clientId: 'client-1',
      proposalId: null,
      purchaseOrderId: 'po-1',
      contractReference: 'CTR-001',
      itemCount: 2,
      totalAmount: '1500.0000',
      currencyCode: 'BRL',
      capturedAt: '2026-09-01T00:00:00.000Z',
    });

    expect(snapshot.serviceOrderId).toBe('so-1');
    expect(snapshot.measurementId).toBe('msr-1');
    expect(snapshot.purchaseOrderId).toBe('po-1');
    expect(snapshot.contractReference).toBe('CTR-001');
  });

  it('requires traceable measurement items', () => {
    expect(() =>
      assertBillingItemsTraceable([
        {
          measurementItemId: 'item-1',
          sourceExecutionEntryId: 'entry-1',
          lineNumber: 1,
          unitCode: 'SERVICE',
          quantity: '1',
          lineAmount: '1000.0000',
        },
      ]),
    ).not.toThrow();

    expect(() =>
      assertBillingItemsTraceable([
        {
          measurementItemId: '',
          sourceExecutionEntryId: null,
          lineNumber: 1,
          unitCode: 'SERVICE',
          quantity: '1',
          lineAmount: '1000.0000',
        },
      ]),
    ).toThrow(BillingInvariantError);
  });
});