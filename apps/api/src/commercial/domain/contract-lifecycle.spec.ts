import { describe, expect, it } from 'vitest';
import {
  CONTRACT_STATUSES,
  assertContractTransition,
  assertNoContractHistoryRewrite,
  effectiveContractStatus,
} from './contract';
import {
  applyUnitPriceAdjustment,
  isAdjustmentEffective,
  parseContractCommercialTerms,
  type ContractAdjustmentRecord,
} from './contract-terms';

describe('customer contract lifecycle (domain)', () => {
  it('derives EXPIRED when ACTIVE passes valid_to (expiração efetiva)', () => {
    const contract = { status: CONTRACT_STATUSES.Active, validTo: '2026-08-31' };
    expect(effectiveContractStatus(contract, new Date('2026-08-31T12:00:00.000Z'))).toBe('ACTIVE');
    expect(effectiveContractStatus(contract, new Date('2026-09-01T12:00:00.000Z'))).toBe('EXPIRED');
    expect(effectiveContractStatus({ status: CONTRACT_STATUSES.Closed, validTo: '2020-01-01' })).toBe('CLOSED');
    expect(effectiveContractStatus({ status: CONTRACT_STATUSES.Active, validTo: null })).toBe('ACTIVE');
  });

  it('keeps vigência boundaries for activation', () => {
    expect(assertContractTransition(CONTRACT_STATUSES.Draft, CONTRACT_STATUSES.Active)).toBe(true);
    expect(assertContractTransition(CONTRACT_STATUSES.Active, CONTRACT_STATUSES.Expired)).toBe(true);
    expect(assertContractTransition(CONTRACT_STATUSES.Expired, CONTRACT_STATUSES.Active)).toBe(false);
    expect(assertContractTransition(CONTRACT_STATUSES.Closed, CONTRACT_STATUSES.Expired)).toBe(false);
  });

  it('guards append-only history (HISTORY LOSS 0 semantics)', () => {
    expect(() => assertNoContractHistoryRewrite()).toThrow('CONTRACT_HISTORY_IMMUTABLE');
  });

  it('applies unit price reajuste with half-up rounding on scaled money', () => {
    expect(applyUnitPriceAdjustment('1000.0000', '5.0000')).toBe('1050');
    expect(applyUnitPriceAdjustment('1000.0000', '10')).toBe('1100');
    expect(applyUnitPriceAdjustment('9351.5000', '0.0000')).toBe('9351.5');
    expect(applyUnitPriceAdjustment('0.0000', '5.0000')).toBe('0');
  });

  it('parses typed reajuste/limits from commercial_terms tolerantly', () => {
    const parsed = parseContractCommercialTerms({
      adjustments: [
        { effectiveOn: '2026-01-01', percent: '5.0000', indexCode: 'IPCA' },
        { effectiveOn: 'not-a-date', percent: '5.0000' },
        { effectiveOn: '2026-06-01', percent: 'abc' },
        'garbage',
      ],
      limits: { maxTotalAmount: '50000.0000', allowOverrun: false, bogus: 1 },
    });
    expect(parsed.adjustments).toHaveLength(1);
    expect(parsed.adjustments?.[0]).toMatchObject({ effectiveOn: '2026-01-01', percent: '5.0000', indexCode: 'IPCA' });
    expect(parsed.limits?.maxTotalAmount).toBe('50000.0000');
    expect(parsed.limits?.allowOverrun).toBe(false);
    expect(parseContractCommercialTerms(null)).toEqual({});
  });

  it('evaluates adjustment effectiveness by date', () => {
    const record: ContractAdjustmentRecord = { effectiveOn: '2026-03-01', percent: '5.0000' };
    expect(isAdjustmentEffective(record, '2026-02-28')).toBe(false);
    expect(isAdjustmentEffective(record, '2026-03-01')).toBe(true);
  });
});
