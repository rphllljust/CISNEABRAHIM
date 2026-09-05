import {
  MEASUREMENT_STATUSES,
  type MeasurementStatus,
  type MeasurementTransition,
} from './measurement';

export class MeasurementStateError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

const TRANSITIONS: Record<
  MeasurementTransition,
  { from: MeasurementStatus[]; to: MeasurementStatus }
> = {
  submit: {
    from: [MEASUREMENT_STATUSES.Draft],
    to: MEASUREMENT_STATUSES.Submitted,
  },
  startReview: {
    from: [MEASUREMENT_STATUSES.Submitted],
    to: MEASUREMENT_STATUSES.UnderReview,
  },
  approve: {
    from: [MEASUREMENT_STATUSES.UnderReview],
    to: MEASUREMENT_STATUSES.Approved,
  },
  reject: {
    from: [MEASUREMENT_STATUSES.UnderReview],
    to: MEASUREMENT_STATUSES.Rejected,
  },
  resubmit: {
    from: [MEASUREMENT_STATUSES.Rejected],
    to: MEASUREMENT_STATUSES.Draft,
  },
};

export function assertTransition(
  currentStatus: MeasurementStatus,
  transition: MeasurementTransition,
): MeasurementStatus {
  const rule = TRANSITIONS[transition];
  if (!rule.from.includes(currentStatus)) {
    throw new MeasurementStateError('INVALID_STATE_TRANSITION');
  }
  return rule.to;
}

export function canTransition(
  currentStatus: MeasurementStatus,
  transition: MeasurementTransition,
): boolean {
  return TRANSITIONS[transition].from.includes(currentStatus);
}
