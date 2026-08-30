import type { RateMetric, DurationMetric } from './productivity-rate';

export const PRODUCTIVITY_GROUP_BY = {
  None: 'none',
  Unit: 'unit',
  Archetype: 'archetype',
} as const;

export type ProductivityGroupBy =
  (typeof PRODUCTIVITY_GROUP_BY)[keyof typeof PRODUCTIVITY_GROUP_BY];

export type ProductivitySummary = {
  completed: number;
  onTimeRate: RateMetric;
  averageCycleTime: DurationMetric;
  reworkRate: RateMetric & { concept: string | null };
  utilization: RateMetric & { concept: string | null };
  evidenceCompleteness: RateMetric;
  measurementAcceptance: RateMetric;
};

export type ProductivitySnapshot = {
  generatedAt: string;
  businessTimezone: string;
  period: {
    preset: string;
    from: string;
    to: string;
    fromInclusive: string;
    toExclusive: string;
  };
  groupBy: ProductivityGroupBy;
  visibility: {
    serviceOrders: boolean;
    measurements: boolean;
    resources: boolean;
  };
  summary: ProductivitySummary;
  groups: Array<{
    key: string;
    label: string;
    summary: ProductivitySummary;
  }>;
};

export type ProductivityRawAggregates = {
  completed: number;
  onTimeNumerator: number;
  onTimeDenominator: number;
  cycleTimeTotalHours: number | null;
  cycleTimeSampleSize: number;
  reworkNumerator: number;
  reworkDenominator: number;
  utilizationNumeratorSeconds: number;
  utilizationDenominatorSeconds: number;
  evidenceNumerator: number;
  evidenceDenominator: number;
  measurementApproved: number;
  measurementDecided: number;
};

export function emptyProductivityRawAggregates(): ProductivityRawAggregates {
  return {
    completed: 0,
    onTimeNumerator: 0,
    onTimeDenominator: 0,
    cycleTimeTotalHours: null,
    cycleTimeSampleSize: 0,
    reworkNumerator: 0,
    reworkDenominator: 0,
    utilizationNumeratorSeconds: 0,
    utilizationDenominatorSeconds: 0,
    evidenceNumerator: 0,
    evidenceDenominator: 0,
    measurementApproved: 0,
    measurementDecided: 0,
  };
}
