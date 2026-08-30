import { describe, expect, it } from 'vitest';
import { SERVICE_ORDER_STATUSES } from '../../service-orders/domain/service-order';
import {
  evaluateServiceOrderDueSoon,
  evaluateServiceOrderOverdueAlert,
  shouldEscalateOverdueServiceOrder,
} from './alert-evaluation.engine';

const SERVICE_ORDER_ID = '11111111-1111-4111-8111-111111111111';

describe('service order alert evaluation', () => {
  const policy = {
    approachingDueDays: 7,
    measurementAgingDays: 1,
    billingAgingDays: 3,
    serviceOrderStalledDays: null,
    escalationOverdueDays: 3,
  };

  it('does not alert overdue before deadline', () => {
    const now = new Date('2026-08-29T12:00:00.000Z');
    const deadline = new Date('2026-08-30T12:00:00.000Z');
    const result = evaluateServiceOrderOverdueAlert(
      {
        id: SERVICE_ORDER_ID,
        unitId: 'unit-a',
        clientId: null,
        status: SERVICE_ORDER_STATUSES.InExecution,
        deadline,
        createdAt: now,
      },
      now,
      policy,
    );
    expect(result).toBeNull();
  });

  it('alerts overdue exactly at deadline', () => {
    const deadline = new Date('2026-08-29T12:00:00.000Z');
    const now = new Date('2026-08-29T12:00:00.000Z');
    const result = evaluateServiceOrderOverdueAlert(
      {
        id: SERVICE_ORDER_ID,
        unitId: 'unit-a',
        clientId: null,
        status: SERVICE_ORDER_STATUSES.InExecution,
        deadline,
        createdAt: deadline,
      },
      now,
      policy,
    );
    expect(result?.conditionPhase).toBe('OVERDUE');
  });

  it('alerts due soon before deadline within threshold', () => {
    const now = new Date('2026-08-29T12:00:00.000Z');
    const deadline = new Date('2026-08-31T12:00:00.000Z');
    const result = evaluateServiceOrderDueSoon(
      {
        id: SERVICE_ORDER_ID,
        unitId: 'unit-a',
        clientId: null,
        status: SERVICE_ORDER_STATUSES.InExecution,
        deadline,
        createdAt: now,
      },
      now,
      policy,
    );
    expect(result?.alertType).toBe('SERVICE_ORDER_DUE_SOON');
  });

  it('escalates only when configured threshold is reached', () => {
    expect(shouldEscalateOverdueServiceOrder(2, policy)).toBe(false);
    expect(shouldEscalateOverdueServiceOrder(3, policy)).toBe(true);
  });
});
