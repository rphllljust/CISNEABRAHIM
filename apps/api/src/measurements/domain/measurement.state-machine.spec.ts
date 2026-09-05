import { describe, expect, it } from 'vitest';
import { MEASUREMENT_STATUSES } from './measurement';
import { assertTransition, MeasurementStateError } from './measurement.state-machine';

describe('measurement state machine', () => {
  it('supports review workflow transitions', () => {
    expect(assertTransition(MEASUREMENT_STATUSES.Draft, 'submit')).toBe(
      MEASUREMENT_STATUSES.Submitted,
    );
    expect(assertTransition(MEASUREMENT_STATUSES.Submitted, 'startReview')).toBe(
      MEASUREMENT_STATUSES.UnderReview,
    );
    expect(assertTransition(MEASUREMENT_STATUSES.UnderReview, 'approve')).toBe(
      MEASUREMENT_STATUSES.Approved,
    );
    expect(assertTransition(MEASUREMENT_STATUSES.UnderReview, 'reject')).toBe(
      MEASUREMENT_STATUSES.Rejected,
    );
    expect(assertTransition(MEASUREMENT_STATUSES.Rejected, 'resubmit')).toBe(
      MEASUREMENT_STATUSES.Draft,
    );
  });

  it('rejects invalid transitions', () => {
    expect(() => assertTransition(MEASUREMENT_STATUSES.Draft, 'approve')).toThrow(
      MeasurementStateError,
    );
  });
});
