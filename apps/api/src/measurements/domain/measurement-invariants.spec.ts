import { describe, expect, it } from 'vitest';
import { MeasurementError } from './measurement';
import {
  assertExecutionEntriesAvailableForMeasurement,
  assertNoDuplicateExecutionEntrySelection,
  buildMeasurementCommercialLinkage,
  summarizeBillableQuantity,
} from './measurement-invariants';

describe('measurement-invariants', () => {
  it('builds commercial linkage from service order references', () => {
    const linkage = buildMeasurementCommercialLinkage({
      id: 'so-1',
      proposal_id: 'prop-1',
      purchase_order_id: 'po-1',
      contract_reference: 'CTR-2026-001',
      contract_snapshot: { paymentTerms: '30 DDL' },
      started_at: '2026-06-01T08:00:00.000Z',
      completed_at: '2026-06-01T18:00:00.000Z',
    });
    expect(linkage).toMatchObject({
      serviceOrderId: 'so-1',
      proposalId: 'prop-1',
      purchaseOrderId: 'po-1',
      contractReference: 'CTR-2026-001',
    });
    expect(linkage.servicePeriod?.startedAt).toBe('2026-06-01T08:00:00.000Z');
  });

  it('rejects duplicate execution entry selection in the same measurement', () => {
    expect(() => assertNoDuplicateExecutionEntrySelection(['a', 'a'])).toThrow(MeasurementError);
  });

  it('rejects execution entries already locked by approved measurement', () => {
    expect(() =>
      assertExecutionEntriesAvailableForMeasurement(['entry-1', 'entry-2'], ['entry-2']),
    ).toThrow('EXECUTION_ENTRY_ALREADY_MEASURED');
  });

  it('summarizes billable measured quantity', () => {
    expect(
      summarizeBillableQuantity([
        { measuredQuantity: '1' },
        { measuredQuantity: '2.5' },
      ]),
    ).toBe('3.5');
  });
});