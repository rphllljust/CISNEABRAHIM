import { subtractMoneyAmounts } from '../../platform/kernel/money-math';
import type { CashForecastLine } from '../domain/cash-flow-forecast';
import { CASH_FLOW_KINDS, normalizeForecastAmount } from '../domain/cash-flow-forecast';

export type CashForecastResponse = {
  status: 'PROJECTED' | 'NO_DATA';
  unitId: string;
  currencyCode: string;
  asOf: string;
  horizonEndsOn: string;
  realized: {
    kind: 'REALIZED';
    cashBalance: string;
    inflows: string;
    outflows: string;
  };
  forecast: {
    kind: 'FORECAST';
    inflows: string;
    outflows: string;
    overdueInflows: string;
    overdueOutflows: string;
    net: string;
  };
  projectedCash: {
    kind: 'FORECAST';
    amount: string;
  };
  falseRealizedValues: number;
  lines: CashForecastLine[];
  reconciliation: {
    receivablePrincipal: string;
    receivableRealized: string;
    receivableForecast: string;
    payablePrincipal: string;
    payableRealized: string;
    payableForecast: string;
    horizonExcludedInflows: string;
    horizonExcludedOutflows: string;
    balanced: boolean;
  };
};

export function toCashForecastResponse(input: {
  unitId: string;
  currencyCode: string;
  asOf: string;
  horizonEndsOn: string;
  status: 'PROJECTED' | 'NO_DATA';
  realizedCash: string;
  realizedInflows: string;
  realizedOutflows: string;
  forecastInflows: string;
  forecastOutflows: string;
  overdueInflows: string;
  overdueOutflows: string;
  projectedCash: string;
  falseRealizedValues: number;
  lines: CashForecastLine[];
  reconciliation: CashForecastResponse['reconciliation'];
}): CashForecastResponse {
  return {
    status: input.status,
    unitId: input.unitId,
    currencyCode: input.currencyCode,
    asOf: input.asOf,
    horizonEndsOn: input.horizonEndsOn,
    realized: {
      kind: CASH_FLOW_KINDS.Realized,
      cashBalance: input.realizedCash,
      inflows: input.realizedInflows,
      outflows: input.realizedOutflows,
    },
    forecast: {
      kind: CASH_FLOW_KINDS.Forecast,
      inflows: input.forecastInflows,
      outflows: input.forecastOutflows,
      overdueInflows: input.overdueInflows,
      overdueOutflows: input.overdueOutflows,
      net: normalizeForecastAmount(subtractMoneyAmounts(input.forecastInflows, input.forecastOutflows)),
    },
    projectedCash: {
      kind: CASH_FLOW_KINDS.Forecast,
      amount: input.projectedCash,
    },
    falseRealizedValues: input.falseRealizedValues,
    lines: input.lines,
    reconciliation: input.reconciliation,
  };
}
