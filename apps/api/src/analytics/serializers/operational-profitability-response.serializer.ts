import type { ResolvedProductivityPeriod } from '../domain/productivity-period';
import {
  PROFITABILITY_GROUP_BY,
  buildProfitabilitySummary,
  groupProfitabilityRows,
  resolveSupportedDimensions,
  type ProfitabilityGroupBy,
  type ProfitabilityServiceOrderRaw,
  type ProfitabilitySnapshot,
} from '../domain/operational-profitability-summary';

export function buildOperationalProfitabilitySnapshot(input: {
  generatedAt: string;
  period: ResolvedProductivityPeriod;
  groupBy: ProfitabilityGroupBy;
  visibility: ProfitabilitySnapshot['visibility'];
  rows: ProfitabilityServiceOrderRaw[];
}): ProfitabilitySnapshot {
  const currencyCode = input.rows[0]?.currencyCode ?? 'BRL';
  const maskedRows = maskRowsForVisibility(input.rows, input.visibility);
  const summary = buildProfitabilitySummary(maskedRows, currencyCode);

  return {
    generatedAt: input.generatedAt,
    businessTimezone: input.period.businessTimezone,
    period: {
      preset: input.period.preset,
      from: input.period.labelFrom,
      to: input.period.labelTo,
      fromInclusive: input.period.fromInclusive.toISOString(),
      toExclusive: input.period.toExclusive.toISOString(),
    },
    groupBy: input.groupBy,
    supportedDimensions: resolveSupportedDimensions(maskedRows),
    visibility: input.visibility,
    summary,
    groups: groupProfitabilityRows(maskedRows, input.groupBy, currencyCode),
    lines: maskedRows.map((row) => ({
      serviceOrderId: row.serviceOrderId,
      serviceOrderCode: row.serviceOrderCode,
      clientId: row.clientId,
      contractReference: row.contractReference,
      serviceType: row.serviceType,
      summary: buildProfitabilitySummary([row], row.currencyCode),
    })),
  };
}

function maskRowsForVisibility(
  rows: ProfitabilityServiceOrderRaw[],
  visibility: ProfitabilitySnapshot['visibility'],
): ProfitabilityServiceOrderRaw[] {
  return rows.map((row) => ({
    ...row,
    operationalRevenue: visibility.revenue ? row.operationalRevenue : null,
    realizedCost: visibility.costs ? row.realizedCost : null,
    revenueLineCount: visibility.revenue ? row.revenueLineCount : 0,
    costEntryCount: visibility.costs ? row.costEntryCount : 0,
  }));
}

export function parseProfitabilityGroupBy(value: string | undefined): ProfitabilityGroupBy {
  const normalized = value?.trim().toLowerCase();
  if (normalized === PROFITABILITY_GROUP_BY.ServiceOrder) {
    return PROFITABILITY_GROUP_BY.ServiceOrder;
  }
  if (normalized === PROFITABILITY_GROUP_BY.Client) {
    return PROFITABILITY_GROUP_BY.Client;
  }
  if (normalized === PROFITABILITY_GROUP_BY.Contract) {
    return PROFITABILITY_GROUP_BY.Contract;
  }
  if (normalized === PROFITABILITY_GROUP_BY.ServiceType) {
    return PROFITABILITY_GROUP_BY.ServiceType;
  }
  return PROFITABILITY_GROUP_BY.None;
}
