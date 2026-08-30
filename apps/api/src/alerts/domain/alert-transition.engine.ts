import {
  ALERT_CONDITION_PHASES,
  type AlertConditionPhase,
  type BusinessAlertRecord,
} from './business-alert';
import type { AlertEvaluationResult } from './alert-evaluation.engine';

export type AlertTransitionAction =
  | { type: 'none' }
  | { type: 'create'; evaluation: AlertEvaluationResult }
  | { type: 'touch'; alertId: string }
  | { type: 'resolve'; alertId: string };

export function decideAlertTransition(input: {
  evaluation: AlertEvaluationResult | null;
  activeAlert: BusinessAlertRecord | null;
  activePhase: AlertConditionPhase | null;
}): AlertTransitionAction {
  if (!input.evaluation) {
    if (input.activeAlert) {
      return { type: 'resolve', alertId: input.activeAlert.id };
    }
    return { type: 'none' };
  }

  if (!input.activeAlert) {
    return { type: 'create', evaluation: input.evaluation };
  }

  if (input.activeAlert.conditionPhase !== input.evaluation.conditionPhase) {
    return { type: 'create', evaluation: input.evaluation };
  }

  return { type: 'touch', alertId: input.activeAlert.id };
}

export function isResolvedPhase(phase: AlertConditionPhase): boolean {
  return (
    phase === ALERT_CONDITION_PHASES.NotDueSoon ||
    phase === ALERT_CONDITION_PHASES.NotOverdue ||
    phase === ALERT_CONDITION_PHASES.NotStalled ||
    phase === ALERT_CONDITION_PHASES.NotAging ||
    phase === ALERT_CONDITION_PHASES.NotPaymentOverdue
  );
}
