import { describe, expect, it } from 'vitest';
import {
  ageInWholeDays,
  calendarDaysBetween,
  dueDateMetrics,
  toBusinessCalendarDate,
} from './business-timezone';
import { SERVICE_ORDER_STATUSES } from '../../service-orders/domain/service-order';
import {
  evaluateServiceOrderOverdue,
  isServiceOrderApproachingDue,
} from './service-order-overdue.policy';
import { classifyAgeDays, parseAgingBucketPolicyFromEnv } from './aging-bucket.policy';
import { computeFinancialAgingMetrics } from './financial-aging.engine';
import { sumMoneyAmounts } from '../../billing/domain/billing-totals';

describe('business timezone', () => {
  it('handles midnight boundary in business timezone', () => {
    const instant = new Date('2026-01-15T03:59:00.000Z');
    const date = toBusinessCalendarDate(instant, 'America/Porto_Velho');
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('computes calendar day delta for due dates', () => {
    expect(calendarDaysBetween('2026-01-01', '2026-01-08')).toBe(7);
    expect(calendarDaysBetween('2026-01-08', '2026-01-01')).toBe(-7);
    expect(calendarDaysBetween('2026-01-01', '2026-01-01')).toBe(0);
  });

  it('marks due date exactly today as zero days until due and overdue', () => {
    const now = new Date('2026-03-10T15:00:00.000Z');
    const metrics = dueDateMetrics('2026-03-10', now, 'UTC');
    expect(metrics.daysUntilDue).toBe(0);
    expect(metrics.daysOverdue).toBe(0);
  });

  it('returns null metrics when due date is absent', () => {
    const metrics = dueDateMetrics(null, new Date(), 'UTC');
    expect(metrics.daysUntilDue).toBeNull();
    expect(metrics.daysOverdue).toBeNull();
  });

  it('computes age in whole days from anchor', () => {
    const now = new Date('2026-01-10T00:00:00.000Z');
    const from = new Date('2026-01-01T00:00:00.000Z');
    expect(ageInWholeDays(from, now)).toBe(9);
  });
});

describe('ServiceOrderOverduePolicy', () => {
  const now = new Date('2026-06-15T12:00:00.000Z');

  it('treats active service order past deadline as overdue', () => {
    const result = evaluateServiceOrderOverdue({
      status: SERVICE_ORDER_STATUSES.InExecution,
      deadline: new Date('2026-06-14T12:00:00.000Z'),
      now,
    });
    expect(result.overdue).toBe(true);
    expect(result.delayDays).toBe(1);
  });

  it('treats deadline exactly now as overdue', () => {
    const result = evaluateServiceOrderOverdue({
      status: SERVICE_ORDER_STATUSES.Released,
      deadline: now,
      now,
    });
    expect(result.overdue).toBe(true);
    expect(result.delayDays).toBe(0);
  });

  it('does not mark terminal service order as overdue', () => {
    const result = evaluateServiceOrderOverdue({
      status: SERVICE_ORDER_STATUSES.Completed,
      deadline: new Date('2026-01-01T00:00:00.000Z'),
      now,
    });
    expect(result.overdue).toBe(false);
  });

  it('does not mark in-window service order as overdue', () => {
    const result = evaluateServiceOrderOverdue({
      status: SERVICE_ORDER_STATUSES.InExecution,
      deadline: new Date('2026-06-16T00:00:00.000Z'),
      now,
    });
    expect(result.overdue).toBe(false);
  });

  it('detects approaching due within threshold', () => {
    expect(
      isServiceOrderApproachingDue({
        status: SERVICE_ORDER_STATUSES.InExecution,
        deadline: new Date('2026-06-16T00:00:00.000Z'),
        now,
        thresholdDays: 2,
      }),
    ).toBe(true);
  });
});

describe('aging bucket policy', () => {
  it('defaults to no configured bands', () => {
    expect(parseAgingBucketPolicyFromEnv('').bands).toHaveLength(0);
  });

  it('parses configured bands without treating them as implicit business truth', () => {
    const policy = parseAgingBucketPolicyFromEnv('0-7,8-15,16-30,31-60,61-90,91-*');
    expect(policy.source).toBe('configured');
    expect(classifyAgeDays(10, policy)).toBe('band-8-15');
  });
});

describe('financial aging engine', () => {
  const now = new Date('2026-05-01T12:00:00.000Z');

  it('computes overdue receivable metrics from finalized document due date', () => {
    const metrics = computeFinancialAgingMetrics({
      serviceOrderStatus: 'COMPLETED',
      billingRecordStatus: 'PREPARED',
      billingDocumentStatus: 'FINALIZED',
      preparedAt: '2026-04-01T00:00:00.000Z',
      issuedAt: '2026-04-01T00:00:00.000Z',
      dueDate: '2026-04-20',
      completedAt: '2026-03-20T00:00:00.000Z',
      now,
      businessTimezone: 'UTC',
    });
    expect(metrics?.stage).toBe('overdue');
    expect(metrics?.daysOverdue).toBeGreaterThan(0);
  });

  it('computes future billing as awaiting payment', () => {
    const metrics = computeFinancialAgingMetrics({
      serviceOrderStatus: 'COMPLETED',
      billingRecordStatus: 'PREPARED',
      billingDocumentStatus: 'FINALIZED',
      preparedAt: '2026-04-01T00:00:00.000Z',
      issuedAt: '2026-04-01T00:00:00.000Z',
      dueDate: '2026-06-01',
      completedAt: '2026-03-20T00:00:00.000Z',
      now,
      businessTimezone: 'UTC',
    });
    expect(metrics?.stage).toBe('awaiting_payment');
    expect(metrics?.daysUntilDue).toBeGreaterThan(0);
  });

  it('sums money with decimal-safe arithmetic', () => {
    expect(sumMoneyAmounts(['100.0001', '0.0003'])).toBe('100.0004');
  });
});
