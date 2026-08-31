import { MEASUREMENT_HISTORY_EVENTS } from '../domain/measurement';
import type { MeasurementTransitionInput } from './measurements.repository.types';

export function measurementTransitionSql(transition: MeasurementTransitionInput['transition']): string {
  switch (transition) {
    case 'submit':
      return 'submitted_at = NOW(), submitted_by_identity_id = $4';
    case 'startReview':
      return 'review_started_at = NOW(), review_started_by_identity_id = $4';
    case 'approve':
      return 'decided_at = NOW(), decided_by_identity_id = $4, rejection_reason = NULL';
    case 'reject':
      return 'decided_at = NOW(), decided_by_identity_id = $4, rejection_reason = $6';
  }
}

export function measurementHistoryEventForTransition(
  transition: MeasurementTransitionInput['transition'],
): string {
  switch (transition) {
    case 'submit':
      return MEASUREMENT_HISTORY_EVENTS.Submitted;
    case 'startReview':
      return MEASUREMENT_HISTORY_EVENTS.ReviewStarted;
    case 'approve':
      return MEASUREMENT_HISTORY_EVENTS.Approved;
    case 'reject':
      return MEASUREMENT_HISTORY_EVENTS.Rejected;
  }
}
