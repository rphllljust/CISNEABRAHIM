import {
  isPositiveMoneyAmount,
  moneyAmountsEqual,
  multiplyMoneyByPercent,
  normalizeMoneyAmount,
} from '../../platform/kernel/money-math';

/** Fixture labels only. Not ISS, ICMS, PIS, COFINS or any official statute. */
export const TEST_FIXTURE_RULE_CODE = 'TEST_PERCENT';
export const TEST_FIXTURE_SOURCE_REFERENCE = 'TEST-FIXTURE';

export const TAX_RULE_STATUSES = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const;

export const TAX_VERSION_STATUSES = {
  Draft: 'DRAFT',
  Published: 'PUBLISHED',
} as const;

export const TAX_CALCULATION_METHODS = {
  PercentOfBase: 'PERCENT_OF_BASE',
  FixedAmount: 'FIXED_AMOUNT',
} as const;

export const TAX_ROUNDING_MODES = {
  HalfUp: 'HALF_UP',
} as const;

export const OFFICIAL_TAX_TOKENS = ['ISS', 'ICMS', 'PIS', 'COFINS', 'IRRF', 'CSLL', 'IPI', 'CFOP', 'NCM'] as const;

export class TaxEngineError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export type TaxRuleVersionSnapshot = {
  id: string;
  taxRuleId: string;
  versionNumber: number;
  status: string;
  calculationMethod: string;
  roundingMode: string;
  rate: string | null;
  fixedAmount: string | null;
  sourceReference: string;
  effectiveFrom: string;
  effectiveTo: string | null;
};

export type TaxCalculationInputs = {
  ruleVersionId: string;
  ruleCode?: string;
  currencyCode: string;
  baseAmount: string;
  effectiveOn: string;
  attributes: Record<string, unknown>;
};

export type TaxComputation = {
  ruleVersionId: string;
  inputs: TaxCalculationInputs;
  baseAmount: string;
  rate: string | null;
  resultAmount: string;
  roundingMode: string;
};

export function assertNotOfficialTaxLabel(value: string): void {
  const upper = value.trim().toUpperCase();
  for (const token of OFFICIAL_TAX_TOKENS) {
    if (upper === token || upper.startsWith(`${token}_`) || upper.endsWith(`_${token}`)) {
      throw new TaxEngineError('TAX_RULE_NOT_CONFIGURED');
    }
  }
}

export function assertPublishedVersionImmutable(status: string): void {
  if (status === TAX_VERSION_STATUSES.Published) {
    throw new TaxEngineError('TAX_VERSION_IMMUTABLE');
  }
}

export function assertVersionUsableForCalculation(version: TaxRuleVersionSnapshot): void {
  if (version.status !== TAX_VERSION_STATUSES.Published) {
    throw new TaxEngineError('TAX_RULE_NOT_CONFIGURED');
  }
  if (version.roundingMode !== TAX_ROUNDING_MODES.HalfUp) {
    throw new TaxEngineError('TAX_RULE_NOT_CONFIGURED');
  }
  if (!version.sourceReference.trim()) {
    throw new TaxEngineError('TAX_RULE_NOT_CONFIGURED');
  }
}

export function computeTaxResult(
  version: TaxRuleVersionSnapshot,
  inputs: TaxCalculationInputs,
): TaxComputation {
  assertVersionUsableForCalculation(version);
  if (version.id !== inputs.ruleVersionId) {
    throw new TaxEngineError('TAX_RULE_NOT_CONFIGURED');
  }
  if (!isPositiveMoneyAmount(inputs.baseAmount)) {
    throw new TaxEngineError('TAX_INVALID_CONTEXT');
  }
  const baseAmount = normalizeMoneyAmount(inputs.baseAmount);

  if (version.calculationMethod === TAX_CALCULATION_METHODS.PercentOfBase) {
    if (version.rate === null || !isPositiveMoneyAmount(version.rate)) {
      throw new TaxEngineError('TAX_RULE_NOT_CONFIGURED');
    }
    const rate = normalizeMoneyAmount(version.rate);
    return {
      ruleVersionId: version.id,
      inputs: { ...inputs, baseAmount, ruleVersionId: version.id },
      baseAmount,
      rate,
      resultAmount: normalizeMoneyAmount(multiplyMoneyByPercent(baseAmount, rate)),
      roundingMode: version.roundingMode,
    };
  }

  if (version.calculationMethod === TAX_CALCULATION_METHODS.FixedAmount) {
    if (version.fixedAmount === null || !isPositiveMoneyAmount(version.fixedAmount)) {
      throw new TaxEngineError('TAX_RULE_NOT_CONFIGURED');
    }
    return {
      ruleVersionId: version.id,
      inputs: { ...inputs, baseAmount, ruleVersionId: version.id },
      baseAmount,
      rate: null,
      resultAmount: normalizeMoneyAmount(version.fixedAmount),
      roundingMode: version.roundingMode,
    };
  }

  throw new TaxEngineError('TAX_RULE_NOT_CONFIGURED');
}

export function reproduceHistoricalCalculation(
  stored: { taxRuleVersionId: string; inputs: TaxCalculationInputs; resultAmount: string },
  storedVersion: TaxRuleVersionSnapshot,
): { recomputed: TaxComputation; matches: boolean } {
  if (stored.taxRuleVersionId !== storedVersion.id) {
    throw new TaxEngineError('TAX_RULE_NOT_CONFIGURED');
  }
  const pinnedInputs: TaxCalculationInputs = {
    ...stored.inputs,
    ruleVersionId: stored.taxRuleVersionId,
  };
  const recomputed = computeTaxResult(storedVersion, pinnedInputs);
  return {
    recomputed,
    matches: moneyAmountsEqual(recomputed.resultAmount, stored.resultAmount),
  };
}

export function publishedWindowsOverlap(
  left: { effectiveFrom: string; effectiveTo: string | null },
  right: { effectiveFrom: string; effectiveTo: string | null },
): boolean {
  const leftEnd = left.effectiveTo ?? '9999-12-31';
  const rightEnd = right.effectiveTo ?? '9999-12-31';
  return left.effectiveFrom <= rightEnd && right.effectiveFrom <= leftEnd;
}
