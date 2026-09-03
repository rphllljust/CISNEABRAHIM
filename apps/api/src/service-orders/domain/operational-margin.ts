import {
  OPERATIONAL_PROFITABILITY_DISCLAIMER,
  aggregateOperationalProfitability,
  computeOperationalMargin,
  sumNullableMoneyAmounts,
} from '../../commercial/domain/operational-financials';

export type OperationalCostLineSummary = {
  id: string;
  category: string;
  costKind: string;
  origin: string;
  amount: string;
  currencyCode: string;
  sourceExecutionEntryId: string | null;
};

export type OperationalMarginSummary = {
  capturedAt: string;
  currencyCode: string;
  revenue: string | null;
  totalEstimatedCost: string | null;
  totalActualCost: string | null;
  estimatedMargin: string | null;
  actualMargin: string | null;
  disclaimer: string;
  lines: OperationalCostLineSummary[];
};

export function buildOperationalMarginSummary(input: {
  revenue: string | null;
  currencyCode: string;
  lines: OperationalCostLineSummary[];
}): OperationalMarginSummary {
  const estimated = input.lines
    .filter((line) => line.costKind === 'ESTIMATED')
    .map((line) => line.amount);
  const actual = input.lines
    .filter((line) => line.costKind === 'ACTUAL')
    .map((line) => line.amount);

  const totalEstimatedCost = sumNullableMoneyAmounts(estimated);
  const totalActualCost = sumNullableMoneyAmounts(actual);

  return {
    capturedAt: new Date().toISOString(),
    currencyCode: input.currencyCode,
    revenue: input.revenue,
    totalEstimatedCost,
    totalActualCost,
    estimatedMargin: computeOperationalMargin(input.revenue, totalEstimatedCost),
    actualMargin: computeOperationalMargin(input.revenue, totalActualCost),
    disclaimer: OPERATIONAL_PROFITABILITY_DISCLAIMER,
    lines: input.lines,
  };
}

export { aggregateOperationalProfitability };
