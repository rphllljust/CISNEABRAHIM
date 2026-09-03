import { sumMoneyAmounts } from './billing-totals';

export type BillingCostLineSummary = {
  lineNumber: number;
  measurementItemId: string;
  internalCost: string | null;
  lineAmount: string | null;
  modelCode: string | null;
};

export type BillingCostSummary = {
  capturedAt: string;
  totalInternalCost: string | null;
  totalRevenue: string;
  lines: BillingCostLineSummary[];
};

export function buildBillingCostSummaryFromMeasurementItems(
  items: Array<{
    id: string;
    line_number: number;
    line_amount: string | null;
    pricing_line_snapshot: Record<string, unknown>;
  }>,
): BillingCostSummary {
  const lines: BillingCostLineSummary[] = items.map((item) => {
    const snapshot = item.pricing_line_snapshot as {
      internalCost?: string | null;
      modelCode?: string | null;
    };
    return {
      lineNumber: item.line_number,
      measurementItemId: item.id,
      internalCost:
        typeof snapshot.internalCost === 'string' ? snapshot.internalCost : null,
      lineAmount: item.line_amount,
      modelCode: typeof snapshot.modelCode === 'string' ? snapshot.modelCode : null,
    };
  });

  const internalCosts = lines
    .map((line) => line.internalCost)
    .filter((value): value is string => Boolean(value));
  const revenues = lines
    .map((line) => line.lineAmount)
    .filter((value): value is string => Boolean(value));

  return {
    capturedAt: new Date().toISOString(),
    totalInternalCost: internalCosts.length > 0 ? sumMoneyAmounts(internalCosts) : null,
    totalRevenue: revenues.length > 0 ? sumMoneyAmounts(revenues) : '0.0000',
    lines,
  };
}