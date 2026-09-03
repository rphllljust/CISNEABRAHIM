import { describe, expect, it } from 'vitest';
import { moneyAmountsEqual, multiplyMoneyByPercent, normalizeMoneyAmount } from '../../platform/kernel/money-math';
import {
  OFFICIAL_TAX_TOKENS,
  TAX_CALCULATION_METHODS,
  TAX_ROUNDING_MODES,
  TAX_VERSION_STATUSES,
  TEST_FIXTURE_RULE_CODE,
  TEST_FIXTURE_SOURCE_REFERENCE,
  assertPublishedVersionImmutable,
  computeTaxResult,
  publishedWindowsOverlap,
  reproduceHistoricalCalculation,
  type TaxCalculationInputs,
  type TaxRuleVersionSnapshot,
} from './tax-engine';

function publishedPercent(overrides: Partial<TaxRuleVersionSnapshot> = {}): TaxRuleVersionSnapshot {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    taxRuleId: '22222222-2222-4222-8222-222222222222',
    versionNumber: 1,
    status: TAX_VERSION_STATUSES.Published,
    calculationMethod: TAX_CALCULATION_METHODS.PercentOfBase,
    roundingMode: TAX_ROUNDING_MODES.HalfUp,
    rate: '5.0000',
    fixedAmount: null,
    sourceReference: TEST_FIXTURE_SOURCE_REFERENCE,
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-06-30',
    ...overrides,
  };
}

function inputs(overrides: Partial<TaxCalculationInputs> = {}): TaxCalculationInputs {
  return {
    ruleVersionId: '11111111-1111-4111-8111-111111111111',
    ruleCode: TEST_FIXTURE_RULE_CODE,
    currencyCode: 'BRL',
    baseAmount: '100.0000',
    effectiveOn: '2026-03-15',
    attributes: { fixture: true },
    ...overrides,
  };
}

describe('tax engine domain', () => {
  it('keeps fixture labels free of official tax statutes', () => {
    for (const token of OFFICIAL_TAX_TOKENS) {
      expect(TEST_FIXTURE_RULE_CODE.toUpperCase()).not.toContain(token);
      expect(TEST_FIXTURE_SOURCE_REFERENCE.toUpperCase()).not.toContain(token);
    }
  });

  it('treats a published version as immutable', () => {
    expect(() => assertPublishedVersionImmutable(TAX_VERSION_STATUSES.Published)).toThrowError(
      'TAX_VERSION_IMMUTABLE',
    );
    expect(() => assertPublishedVersionImmutable(TAX_VERSION_STATUSES.Draft)).not.toThrow();
  });

  it('refuses unpublished, missing-rate or unknown methods instead of assuming a rate', () => {
    expect(() =>
      computeTaxResult(publishedPercent({ status: TAX_VERSION_STATUSES.Draft }), inputs()),
    ).toThrowError('TAX_RULE_NOT_CONFIGURED');
    expect(() => computeTaxResult(publishedPercent({ rate: null }), inputs())).toThrowError(
      'TAX_RULE_NOT_CONFIGURED',
    );
    expect(() => computeTaxResult(publishedPercent({ rate: '0.0000' }), inputs())).toThrowError(
      'TAX_RULE_NOT_CONFIGURED',
    );
    expect(() =>
      computeTaxResult(publishedPercent({ calculationMethod: 'ASSUMED_CURRENT' }), inputs()),
    ).toThrowError('TAX_RULE_NOT_CONFIGURED');
  });

  it('rejects an invalid calculation context', () => {
    expect(() => computeTaxResult(publishedPercent(), inputs({ baseAmount: '0.0000' }))).toThrowError(
      'TAX_INVALID_CONTEXT',
    );
  });

  it('applies stored HALF_UP percent math without inventing a statute', () => {
    const result = computeTaxResult(publishedPercent(), inputs({ baseAmount: '10.0015' }));
    expect(result.rate).toBe('5.0000');
    expect(result.resultAmount).toBe(normalizeMoneyAmount(multiplyMoneyByPercent('10.0015', '5.0000')));
    expect(moneyAmountsEqual(result.resultAmount, '0.5001')).toBe(true);
  });

  it('reproduces a historical calculation from the stored version, not a later one', () => {
    const first = publishedPercent();
    const stored = computeTaxResult(first, inputs());
    const later = publishedPercent({
      id: '33333333-3333-4333-8333-333333333333',
      versionNumber: 2,
      rate: '12.0000',
      effectiveFrom: '2026-07-01',
      effectiveTo: null,
    });
    const replay = reproduceHistoricalCalculation(
      {
        taxRuleVersionId: first.id,
        inputs: stored.inputs,
        resultAmount: stored.resultAmount,
      },
      first,
    );
    expect(replay.matches).toBe(true);
    expect(replay.recomputed.rate).toBe('5.0000');
    expect(replay.recomputed.ruleVersionId).toBe(first.id);
    expect(() =>
      reproduceHistoricalCalculation(
        {
          taxRuleVersionId: first.id,
          inputs: stored.inputs,
          resultAmount: stored.resultAmount,
        },
        later,
      ),
    ).toThrowError('TAX_RULE_NOT_CONFIGURED');
  });

  it('detects overlapping published windows so a new law becomes a new version', () => {
    expect(
      publishedWindowsOverlap(
        { effectiveFrom: '2026-01-01', effectiveTo: '2026-06-30' },
        { effectiveFrom: '2026-06-01', effectiveTo: null },
      ),
    ).toBe(true);
    expect(
      publishedWindowsOverlap(
        { effectiveFrom: '2026-01-01', effectiveTo: '2026-06-30' },
        { effectiveFrom: '2026-07-01', effectiveTo: null },
      ),
    ).toBe(false);
  });
});
