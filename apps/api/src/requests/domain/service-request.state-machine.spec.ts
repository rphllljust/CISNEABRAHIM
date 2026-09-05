import { describe, expect, it } from 'vitest';
import {
  SERVICE_REQUEST_HISTORY_EVENTS,
  SERVICE_REQUEST_STATUSES,
  type ServiceRequestStatus,
  type ServiceRequestTransition,
} from './service-request';
import {
  assertConvertible,
  assertTransition,
  canTransition,
  historyEventTypeForTransition,
  ServiceRequestStateError,
} from './service-request.state-machine';

const ALL_STATUSES = Object.values(SERVICE_REQUEST_STATUSES);
const ALL_TRANSITIONS: ServiceRequestTransition[] = [
  'submit',
  'startReview',
  'approve',
  'reject',
  'cancel',
  'convert',
];

describe('service-request.state-machine', () => {
  it('allows the happy-path lifecycle transitions', () => {
    expect(assertTransition(SERVICE_REQUEST_STATUSES.Draft, 'submit')).toBe(
      SERVICE_REQUEST_STATUSES.Submitted,
    );
    expect(assertTransition(SERVICE_REQUEST_STATUSES.Submitted, 'startReview')).toBe(
      SERVICE_REQUEST_STATUSES.UnderReview,
    );
    expect(assertTransition(SERVICE_REQUEST_STATUSES.UnderReview, 'approve')).toBe(
      SERVICE_REQUEST_STATUSES.Approved,
    );
    expect(assertTransition(SERVICE_REQUEST_STATUSES.Approved, 'convert')).toBe(
      SERVICE_REQUEST_STATUSES.Converted,
    );
    expect(assertTransition(SERVICE_REQUEST_STATUSES.Converted, 'convert')).toBe(
      SERVICE_REQUEST_STATUSES.Converted,
    );
  });

  it('allows reject from under review', () => {
    expect(assertTransition(SERVICE_REQUEST_STATUSES.UnderReview, 'reject')).toBe(
      SERVICE_REQUEST_STATUSES.Rejected,
    );
  });

  it('allows cancel from draft, submitted, under review and approved', () => {
    for (const status of [
      SERVICE_REQUEST_STATUSES.Draft,
      SERVICE_REQUEST_STATUSES.Submitted,
      SERVICE_REQUEST_STATUSES.UnderReview,
      SERVICE_REQUEST_STATUSES.Approved,
    ]) {
      expect(assertTransition(status, 'cancel')).toBe(SERVICE_REQUEST_STATUSES.Cancelled);
    }
  });

  it('rejects invalid transitions with INVALID_STATE_TRANSITION', () => {
    const invalidPairs: Array<[ServiceRequestStatus, ServiceRequestTransition]> = [
      [SERVICE_REQUEST_STATUSES.Draft, 'approve'],
      [SERVICE_REQUEST_STATUSES.Submitted, 'approve'],
      [SERVICE_REQUEST_STATUSES.Approved, 'submit'],
      [SERVICE_REQUEST_STATUSES.Rejected, 'cancel'],
      [SERVICE_REQUEST_STATUSES.Converted, 'cancel'],
    ];

    for (const [status, transition] of invalidPairs) {
      expect(canTransition(status, transition)).toBe(false);
      expect(() => assertTransition(status, transition)).toThrow(ServiceRequestStateError);
      expect(() => assertTransition(status, transition)).toThrow('INVALID_STATE_TRANSITION');
    }
  });

  it('blocks conversion unless approved or already converted', () => {
    for (const status of [
      SERVICE_REQUEST_STATUSES.Draft,
      SERVICE_REQUEST_STATUSES.Submitted,
      SERVICE_REQUEST_STATUSES.UnderReview,
      SERVICE_REQUEST_STATUSES.Rejected,
      SERVICE_REQUEST_STATUSES.Cancelled,
    ]) {
      expect(() => assertConvertible(status)).toThrow(ServiceRequestStateError);
    }

    expect(() => assertConvertible(SERVICE_REQUEST_STATUSES.Approved)).not.toThrow();
    expect(() => assertConvertible(SERVICE_REQUEST_STATUSES.Converted)).not.toThrow();
  });

  it('maps workflow transitions to history event types', () => {
    expect(historyEventTypeForTransition('submit')).toBe(SERVICE_REQUEST_HISTORY_EVENTS.Submitted);
    expect(historyEventTypeForTransition('startReview')).toBe(
      SERVICE_REQUEST_HISTORY_EVENTS.ReviewStarted,
    );
    expect(historyEventTypeForTransition('approve')).toBe(SERVICE_REQUEST_HISTORY_EVENTS.Approved);
    expect(historyEventTypeForTransition('reject')).toBe(SERVICE_REQUEST_HISTORY_EVENTS.Rejected);
    expect(historyEventTypeForTransition('cancel')).toBe(SERVICE_REQUEST_HISTORY_EVENTS.Cancelled);
  });

  it('defines a complete transition matrix without gaps', () => {
    for (const status of ALL_STATUSES) {
      for (const transition of ALL_TRANSITIONS) {
        const allowed = canTransition(status, transition);
        if (allowed) {
          expect(() => assertTransition(status, transition)).not.toThrow();
        } else if (transition !== 'convert') {
          expect(() => assertTransition(status, transition)).toThrow(ServiceRequestStateError);
        }
      }
    }
  });
});
