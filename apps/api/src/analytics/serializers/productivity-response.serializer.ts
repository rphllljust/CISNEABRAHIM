import { buildProductivitySummary } from '../domain/productivity.engine';
import type { ProductivityGroupBy, ProductivityRawAggregates, ProductivitySnapshot } from '../domain/productivity-summary';
import type { ResolvedProductivityPeriod } from '../domain/productivity-period';

export function buildProductivitySnapshot(input: {
  generatedAt: string;
  period: ResolvedProductivityPeriod;
  groupBy: ProductivityGroupBy;
  visibility: ProductivitySnapshot['visibility'];
  overall: ProductivityRawAggregates;
  groups: Array<{ groupKey: string; groupLabel: string; aggregates: ProductivityRawAggregates }>;
}): ProductivitySnapshot {
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
    visibility: input.visibility,
    summary: buildProductivitySummary(input.overall),
    groups: input.groups.map((group) => ({
      key: group.groupKey,
      label: group.groupLabel,
      summary: buildProductivitySummary(group.aggregates),
    })),
  };
}
