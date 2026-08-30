import { describe, expect, it } from 'vitest';
import { resolveBusinessTimezone } from './business-timezone';
import { buildProductivitySummary } from './productivity.engine';
import { computeRate, formatRateAsPercentage } from './productivity-rate';
import {
  PRODUCTIVITY_PERIOD_PRESETS,
  resolveProductivityPeriod,
} from './productivity-period';
import { emptyProductivityRawAggregates } from './productivity-summary';

describe('productivity rate', () => {
  it('returns unavailable instead of false 0% when denominator is zero', () => {
    const rate = computeRate(0, 0);
    expect(rate.available).toBe(false);
    expect(rate.value).toBeNull();
    expect(formatRateAsPercentage(rate)).toBeNull();
  });

  it('computes explicit numerator and denominator', () => {
    const rate = computeRate(3, 4);
    expect(rate).toEqual({
      value: 0.75,
      numerator: 3,
      denominator: 4,
      available: true,
    });
    expect(formatRateAsPercentage(rate)).toBe('75.00');
  });
});

describe('productivity period', () => {
  const tz = 'UTC';

  it('resolves today in business timezone', () => {
    const period = resolveProductivityPeriod({
      preset: PRODUCTIVITY_PERIOD_PRESETS.Today,
      referenceNow: new Date('2026-03-10T23:59:00.000Z'),
      businessTimezone: tz,
    });
    expect(period.labelFrom).toBe('2026-03-10');
    expect(period.labelTo).toBe('2026-03-10');
    expect(period.toExclusive.getTime()).toBeGreaterThan(period.fromInclusive.getTime());
  });

  it('resolves custom interval with explicit dates', () => {
    const period = resolveProductivityPeriod({
      preset: PRODUCTIVITY_PERIOD_PRESETS.Custom,
      customFrom: '2026-03-01',
      customTo: '2026-03-10',
      businessTimezone: tz,
    });
    expect(period.labelFrom).toBe('2026-03-01');
    expect(period.labelTo).toBe('2026-03-10');
  });

  it('handles month preset from first day to today', () => {
    const period = resolveProductivityPeriod({
      preset: PRODUCTIVITY_PERIOD_PRESETS.Month,
      referenceNow: new Date('2026-03-15T12:00:00.000Z'),
      businessTimezone: tz,
    });
    expect(period.labelFrom).toBe('2026-03-01');
    expect(period.labelTo).toBe('2026-03-15');
  });
});

describe('productivity summary engine', () => {
  it('builds separate metrics without consolidated score', () => {
    const summary = buildProductivitySummary({
      ...emptyProductivityRawAggregates(),
      completed: 5,
      onTimeNumerator: 4,
      onTimeDenominator: 5,
      cycleTimeTotalHours: 10,
      cycleTimeSampleSize: 5,
      reworkNumerator: 1,
      reworkDenominator: 4,
      utilizationNumeratorSeconds: 18_000,
      utilizationDenominatorSeconds: 36_000,
      evidenceNumerator: 5,
      evidenceDenominator: 5,
      measurementApproved: 3,
      measurementDecided: 4,
    });

    expect(summary.completed).toBe(5);
    expect(summary.onTimeRate.value).toBe(0.8);
    expect(summary.averageCycleTime.valueHours).toBe(2);
    expect(summary.reworkRate.concept).toBe('measurement_rejection_rate');
    expect(summary.utilization.concept).toBe('allocated_window_over_planned_window');
    expect(summary.measurementAcceptance.value).toBe(0.75);
    expect(Object.keys(summary)).not.toContain('score');
  });

  it('marks cycle time unavailable for single sample edge without lying', () => {
    const summary = buildProductivitySummary({
      ...emptyProductivityRawAggregates(),
      completed: 1,
      cycleTimeTotalHours: 2,
      cycleTimeSampleSize: 1,
    });
    expect(summary.averageCycleTime.available).toBe(true);
    expect(summary.averageCycleTime.valueHours).toBe(2);
    expect(summary.onTimeRate.available).toBe(false);
  });

  it('uses business timezone resolver default', () => {
    expect(resolveBusinessTimezone()).toBeTruthy();
  });
});
