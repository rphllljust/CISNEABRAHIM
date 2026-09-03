import {
  NON_CONVERTIBLE_SERVICE_REQUEST_STATUSES,
  SERVICE_REQUEST_HISTORY_EVENTS,
  SERVICE_REQUEST_STATUSES,
  type ServiceRequestHistoryEventType,
  type ServiceRequestStatus,
  type ServiceRequestTransition,
} from './service-request';

export class ServiceRequestStateError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

const TRANSITIONS: Record<ServiceRequestTransition, { from: ServiceRequestStatus[]; to: ServiceRequestStatus }> = {
  submit: {
    from: [SERVICE_REQUEST_STATUSES.Draft],
    to: SERVICE_REQUEST_STATUSES.Submitted,
  },
  startReview: {
    from: [SERVICE_REQUEST_STATUSES.Submitted],
    to: SERVICE_REQUEST_STATUSES.UnderReview,
  },
  approve: {
    from: [SERVICE_REQUEST_STATUSES.UnderReview],
    to: SERVICE_REQUEST_STATUSES.Approved,
  },
  reject: {
    from: [SERVICE_REQUEST_STATUSES.UnderReview],
    to: SERVICE_REQUEST_STATUSES.Rejected,
  },
  cancel: {
    from: [
      SERVICE_REQUEST_STATUSES.Draft,
      SERVICE_REQUEST_STATUSES.Submitted,
      SERVICE_REQUEST_STATUSES.UnderReview,
      SERVICE_REQUEST_STATUSES.Approved,
    ],
    to: SERVICE_REQUEST_STATUSES.Cancelled,
  },
  convert: {
    from: [SERVICE_REQUEST_STATUSES.Approved],
    to: SERVICE_REQUEST_STATUSES.Converted,
  },
};

export function assertTransition(
  currentStatus: ServiceRequestStatus,
  transition: ServiceRequestTransition,
): ServiceRequestStatus {
  const rule = TRANSITIONS[transition];
  if (!rule.from.includes(currentStatus)) {
    throw new ServiceRequestStateError('INVALID_STATE_TRANSITION');
  }
  return rule.to;
}

export function canTransition(
  currentStatus: ServiceRequestStatus,
  transition: ServiceRequestTransition,
): boolean {
  return TRANSITIONS[transition].from.includes(currentStatus);
}

export function assertConvertible(currentStatus: ServiceRequestStatus): void {
  if (NON_CONVERTIBLE_SERVICE_REQUEST_STATUSES.has(currentStatus)) {
    throw new ServiceRequestStateError('CONVERSION_NOT_ALLOWED');
  }
  if (currentStatus !== SERVICE_REQUEST_STATUSES.Approved) {
    throw new ServiceRequestStateError('INVALID_STATE_TRANSITION');
  }
}

export function historyEventTypeForTransition(
  transition: Exclude<ServiceRequestTransition, 'convert'>,
): ServiceRequestHistoryEventType {
  switch (transition) {
    case 'submit':
      return SERVICE_REQUEST_HISTORY_EVENTS.Submitted;
    case 'startReview':
      return SERVICE_REQUEST_HISTORY_EVENTS.ReviewStarted;
    case 'approve':
      return SERVICE_REQUEST_HISTORY_EVENTS.Approved;
    case 'reject':
      return SERVICE_REQUEST_HISTORY_EVENTS.Rejected;
    case 'cancel':
      return SERVICE_REQUEST_HISTORY_EVENTS.Cancelled;
    default:
      return SERVICE_REQUEST_HISTORY_EVENTS.Submitted;
  }
}
