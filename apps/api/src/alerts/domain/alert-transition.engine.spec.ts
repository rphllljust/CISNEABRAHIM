import { describe, expect, it } from 'vitest';
import { decideAlertTransition } from './alert-transition.engine';
import { ALERT_CONDITION_PHASES, BUSINESS_ALERT_TYPES } from './business-alert';

describe('decideAlertTransition', () => {
  it('creates when condition becomes active', () => {
    const action = decideAlertTransition({
      evaluation: {
        alertType: BUSINESS_ALERT_TYPES.ServiceOrderOverdue,
        conditionPhase: ALERT_CONDITION_PHASES.Overdue,
        policyWindow: 'overdue:base',
        severity: 'WARNING',
        title: 'OS vencida',
        message: 'Atraso',
        entityHref: '/app/service-orders/1',
        metadata: {},
      },
      activeAlert: null,
      activePhase: null,
    });
    expect(action.type).toBe('create');
  });

  it('touches when active alert already exists for same phase', () => {
    const action = decideAlertTransition({
      evaluation: {
        alertType: BUSINESS_ALERT_TYPES.ServiceOrderOverdue,
        conditionPhase: ALERT_CONDITION_PHASES.Overdue,
        policyWindow: 'overdue:base',
        severity: 'WARNING',
        title: 'OS vencida',
        message: 'Atraso',
        entityHref: '/app/service-orders/1',
        metadata: {},
      },
      activeAlert: {
        id: 'alert-1',
        alertType: BUSINESS_ALERT_TYPES.ServiceOrderOverdue,
        severity: 'WARNING',
        status: 'ACTIVE',
        aggregateType: 'SERVICE_ORDER',
        aggregateId: 'so-1',
        policyWindow: 'overdue:base',
        deduplicationKey: 'key',
        conditionPhase: ALERT_CONDITION_PHASES.Overdue,
        title: 'OS vencida',
        message: 'Atraso',
        entityHref: '/app/service-orders/1',
        unitId: 'unit-a',
        clientId: null,
        metadata: {},
        triggeredAt: '2026-01-01T00:00:00.000Z',
        resolvedAt: null,
        lastSeenAt: '2026-01-01T00:00:00.000Z',
      },
      activePhase: ALERT_CONDITION_PHASES.Overdue,
    });
    expect(action).toEqual({ type: 'touch', alertId: 'alert-1' });
  });

  it('resolves when condition clears', () => {
    const action = decideAlertTransition({
      evaluation: null,
      activeAlert: {
        id: 'alert-1',
        alertType: BUSINESS_ALERT_TYPES.ServiceOrderOverdue,
        severity: 'WARNING',
        status: 'ACTIVE',
        aggregateType: 'SERVICE_ORDER',
        aggregateId: 'so-1',
        policyWindow: 'overdue:base',
        deduplicationKey: 'key',
        conditionPhase: ALERT_CONDITION_PHASES.Overdue,
        title: 'OS vencida',
        message: 'Atraso',
        entityHref: '/app/service-orders/1',
        unitId: 'unit-a',
        clientId: null,
        metadata: {},
        triggeredAt: '2026-01-01T00:00:00.000Z',
        resolvedAt: null,
        lastSeenAt: '2026-01-01T00:00:00.000Z',
      },
      activePhase: ALERT_CONDITION_PHASES.Overdue,
    });
    expect(action).toEqual({ type: 'resolve', alertId: 'alert-1' });
  });
});
