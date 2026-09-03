import {
  isPositiveMoneyAmount,
  moneyAmountsEqual,
  normalizeMoneyAmount,
} from '../../platform/kernel/money-math';
import { reproduceHistoricalCalculation } from './tax-engine';
import type { TaxCalculationInputs, TaxRuleVersionSnapshot } from './tax-engine';

export const TAX_ASSESSMENT_STATUSES = {
  Draft: 'DRAFT',
  Finalized: 'FINALIZED',
  Adjusted: 'ADJUSTED',
  Cancelled: 'CANCELLED',
} as const;

export type TaxAssessmentStatus = (typeof TAX_ASSESSMENT_STATUSES)[keyof typeof TAX_ASSESSMENT_STATUSES];

export const TAX_OBLIGATION_STATUSES = {
  Open: 'OPEN',
  Cancelled: 'CANCELLED',
} as const;

export type TaxObligationStatus = (typeof TAX_OBLIGATION_STATUSES)[keyof typeof TAX_OBLIGATION_STATUSES];

export const TAX_ASSESSMENT_EVENTS = {
  Created: 'CREATED',
  Finalized: 'FINALIZED',
  Adjusted: 'ADJUSTED',
  Cancelled: 'CANCELLED',
} as const;

export class TaxAssessmentError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

const PERIOD_KEY_PATTERN = /^\d{4}-\d{2}$/;

export function periodKeyFromEffectiveOn(effectiveOn: string): string {
  const day = effectiveOn.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new TaxAssessmentError('TAX_ASSESSMENT_INVALID');
  }
  return day.slice(0, 7);
}

export function assertPeriodKey(periodKey: string): string {
  const trimmed = periodKey.trim();
  if (!PERIOD_KEY_PATTERN.test(trimmed)) {
    throw new TaxAssessmentError('TAX_ASSESSMENT_INVALID');
  }
  return trimmed;
}

export function assertAssessedAmount(amount: string): string {
  const normalized = normalizeMoneyAmount(amount);
  if (!isPositiveMoneyAmount(normalized)) {
    throw new TaxAssessmentError('TAX_ASSESSMENT_INVALID');
  }
  return normalized;
}

export function assertAssessmentFinalizable(status: string): void {
  if (status === TAX_ASSESSMENT_STATUSES.Finalized) {
    return;
  }
  if (status !== TAX_ASSESSMENT_STATUSES.Draft) {
    throw new TaxAssessmentError('TAX_ASSESSMENT_INVALID_TRANSITION');
  }
}

export function assertAssessmentAdjustable(status: string): void {
  if (status !== TAX_ASSESSMENT_STATUSES.Finalized) {
    throw new TaxAssessmentError('TAX_ASSESSMENT_INVALID_TRANSITION');
  }
}

export function assertAssessmentCancellable(status: string): void {
  if (status === TAX_ASSESSMENT_STATUSES.Cancelled || status === TAX_ASSESSMENT_STATUSES.Adjusted) {
    return;
  }
  if (status !== TAX_ASSESSMENT_STATUSES.Draft && status !== TAX_ASSESSMENT_STATUSES.Finalized) {
    throw new TaxAssessmentError('TAX_ASSESSMENT_INVALID_TRANSITION');
  }
}

export function assertStoredCalculationValid(input: {
  taxRuleVersionId: string;
  inputs: TaxCalculationInputs;
  resultAmount: string;
  version: TaxRuleVersionSnapshot;
}): string {
  const replay = reproduceHistoricalCalculation(
    {
      taxRuleVersionId: input.taxRuleVersionId,
      inputs: input.inputs,
      resultAmount: input.resultAmount,
    },
    input.version,
  );
  if (!replay.matches) {
    throw new TaxAssessmentError('TAX_ASSESSMENT_INVALID');
  }
  return assertAssessedAmount(input.resultAmount);
}

export function assertFiscalFinanceReconciled(input: {
  assessedAmount: string;
  obligationAmount: string;
  payablePrincipal: string;
}): void {
  if (
    !moneyAmountsEqual(input.assessedAmount, input.obligationAmount) ||
    !moneyAmountsEqual(input.obligationAmount, input.payablePrincipal)
  ) {
    throw new TaxAssessmentError('TAX_FISCAL_FINANCE_MISMATCH');
  }
}

export function assertNoDuplicateActiveAssessment(existingActive: boolean): void {
  if (existingActive) {
    throw new TaxAssessmentError('TAX_ASSESSMENT_DUPLICATE');
  }
}

