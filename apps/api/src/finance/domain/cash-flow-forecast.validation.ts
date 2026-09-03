import { assertCurrencyCode } from '../../platform/kernel/money-math';
import { CashForecastError, asCashForecastIsoDate } from './cash-flow-forecast';

export type ProjectCashForecastInput = {
  unitId: string;
  currencyCode: string;
  asOf?: string;
  horizonEndsOn?: string;
};

function requireNonEmpty(value: string | undefined | null, code: string): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    throw new CashForecastError(code);
  }
  return trimmed;
}

export function validateProjectCashForecastInput(input: ProjectCashForecastInput): {
  unitId: string;
  currencyCode: string;
  asOf: string;
  horizonEndsOn: string;
} {
  const asOf = asCashForecastIsoDate(input.asOf ?? new Date().toISOString().slice(0, 10));
  const horizonEndsOn = asCashForecastIsoDate(input.horizonEndsOn ?? '9999-12-31');
  if (horizonEndsOn < asOf) {
    throw new CashForecastError('CASH_FORECAST_INVALID');
  }
  return {
    unitId: requireNonEmpty(input.unitId, 'CASH_FORECAST_INVALID'),
    currencyCode: assertCurrencyCode(input.currencyCode),
    asOf,
    horizonEndsOn,
  };
}
