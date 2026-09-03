import { describe, expect, it } from 'vitest';
import {
  TAX_CALCULATION_METHODS,
  TAX_ROUNDING_MODES,
  TAX_VERSION_STATUSES,
  TEST_FIXTURE_RULE_CODE,
  type TaxCalculationInputs,
  type TaxRuleVersionSnapshot,
} from './tax-engine';
import {
  TAX_ASSESSMENT_STATUSES,
  TaxAssessmentError,
  assertAssessedAmount,
  assertAssessmentAdjustable,
  assertAssessmentCancellable,
  assertAssessmentFinalizable,
  assertFiscalFinanceReconciled,
  assertPeriodKey,
  assertStoredCalculationValid,
  periodKeyFromEffectiveOn,
} from './tax-assessment';

function publishedPercent(): TaxRuleVersionSnapshot {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    taxRuleId: '22222222-2222-4222-8222-222222222222',
    versionNumber: 1,
    status: TAX_VERSION_STATUSES.Published,
    calculationMethod: TAX_CALCULATION_METHODS.PercentOfBase,
    roundingMode: TAX_ROUNDING_MODES.HalfUp,
    rate: '5.0000',
    fixedAmount: null,
    sourceReference: 'TEST-FIXTURE',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-06-30',
  };
}

function inputs(): TaxCalculationInputs {
  return {
    ruleVersionId: '11111111-1111-4111-8111-111111111111',
    ruleCode: TEST_FIXTURE_RULE_CODE,
    currencyCode: 'BRL',
    baseAmount: '100.0000',
    effectiveOn: '2026-03-15',
    attributes: {},
  };
}

describe('tax assessment domain', () => {
  it('derives period key from stored effective date', () => {
    expect(periodKeyFromEffectiveOn('2026-03-15')).toBe('2026-03');
    expect(assertPeriodKey('2026-03')).toBe('2026-03');
  });

  it('rejects zero or invalid assessed amounts', () => {
    expect(() => assertAssessedAmount('0')).toThrow(TaxAssessmentError);
    expect(() => assertAssessedAmount('1.23456')).toThrow();
    expect(assertAssessedAmount('12.5')).toBe('12.5000');
  });

  it('requires a stored calculation that still reproduces', () => {
    const amount = assertStoredCalculationValid({
      taxRuleVersionId: '11111111-1111-4111-8111-111111111111',
      inputs: inputs(),
      resultAmount: '5.0000',
      version: publishedPercent(),
    });
    expect(amount).toBe('5.0000');
    expect(() =>
      assertStoredCalculationValid({
        taxRuleVersionId: '11111111-1111-4111-8111-111111111111',
        inputs: inputs(),
        resultAmount: '9.0000',
        version: publishedPercent(),
      }),
    ).toThrow(TaxAssessmentError);
  });

  it('allows finalize only from draft or already finalized replay', () => {
    expect(() => assertAssessmentFinalizable(TAX_ASSESSMENT_STATUSES.Draft)).not.toThrow();
    expect(() => assertAssessmentFinalizable(TAX_ASSESSMENT_STATUSES.Finalized)).not.toThrow();
    expect(() => assertAssessmentFinalizable(TAX_ASSESSMENT_STATUSES.Cancelled)).toThrow(
      TaxAssessmentError,
    );
  });

  it('adjusts only a finalized assessment and never treats cancel as delete', () => {
    expect(() => assertAssessmentAdjustable(TAX_ASSESSMENT_STATUSES.Finalized)).not.toThrow();
    expect(() => assertAssessmentAdjustable(TAX_ASSESSMENT_STATUSES.Draft)).toThrow(TaxAssessmentError);
    expect(() => assertAssessmentCancellable(TAX_ASSESSMENT_STATUSES.Finalized)).not.toThrow();
    expect(() => assertAssessmentCancellable(TAX_ASSESSMENT_STATUSES.Adjusted)).not.toThrow();
  });

  it('reconciles assessment, obligation and payable principals', () => {
    expect(() =>
      assertFiscalFinanceReconciled({
        assessedAmount: '5',
        obligationAmount: '5.0000',
        payablePrincipal: '5',
      }),
    ).not.toThrow();
    expect(() =>
      assertFiscalFinanceReconciled({
        assessedAmount: '5',
        obligationAmount: '5',
        payablePrincipal: '4.99',
      }),
    ).toThrow(TaxAssessmentError);
  });
});
