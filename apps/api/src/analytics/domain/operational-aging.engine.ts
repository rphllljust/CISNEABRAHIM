import { SERVICE_REQUEST_STATUSES, type ServiceRequestStatus } from '../../requests/domain/service-request';
import { TERMINAL_SERVICE_REQUEST_STATUSES } from '../../requests/domain/service-request';
import {
  SERVICE_ORDER_STATUSES,
  type ServiceOrderStatus,
} from '../../service-orders/domain/service-order';
import { isTerminalServiceOrderStatus } from '../../service-orders/domain/service-order.state-machine';
import {
  MEASUREMENT_STATUSES,
  type MeasurementStatus,
} from '../../measurements/domain/measurement';
import { TERMINAL_MEASUREMENT_STATUSES } from '../../measurements/domain/measurement';
import { ageInWholeDays } from './business-timezone';

export type OperationalAgingStage =
  | 'service_request_age'
  | 'awaiting_review'
  | 'service_order_draft'
  | 'awaiting_release'
  | 'awaiting_start'
  | 'in_execution'
  | 'paused'
  | 'awaiting_measurement'
  | 'awaiting_billing';

export type OperationalAgingAnchor = {
  stage: OperationalAgingStage;
  anchorAt: Date | string | null;
};

export function resolveServiceRequestAgingAnchor(
  status: ServiceRequestStatus,
  timestamps: {
    createdAt: Date | string;
    submittedAt?: Date | string | null;
    reviewStartedAt?: Date | string | null;
  },
): OperationalAgingAnchor | null {
  if (TERMINAL_SERVICE_REQUEST_STATUSES.has(status)) {
    return null;
  }

  if (status === SERVICE_REQUEST_STATUSES.Submitted) {
    return {
      stage: 'awaiting_review',
      anchorAt: timestamps.submittedAt ?? timestamps.createdAt,
    };
  }

  if (status === SERVICE_REQUEST_STATUSES.UnderReview) {
    return {
      stage: 'awaiting_review',
      anchorAt: timestamps.reviewStartedAt ?? timestamps.submittedAt ?? timestamps.createdAt,
    };
  }

  return {
    stage: 'service_request_age',
    anchorAt: timestamps.createdAt,
  };
}

export function resolveServiceOrderAgingAnchor(
  status: ServiceOrderStatus,
  timestamps: {
    createdAt: Date | string;
    preparedAt?: Date | string | null;
    releasedAt?: Date | string | null;
    startedAt?: Date | string | null;
    pausedAt?: Date | string | null;
    updatedAt?: Date | string | null;
  },
): OperationalAgingAnchor | null {
  if (isTerminalServiceOrderStatus(status)) {
    return null;
  }

  switch (status) {
    case SERVICE_ORDER_STATUSES.Draft:
      return { stage: 'service_order_draft', anchorAt: timestamps.createdAt };
    case SERVICE_ORDER_STATUSES.Prepared:
      return { stage: 'awaiting_release', anchorAt: timestamps.preparedAt ?? timestamps.updatedAt ?? timestamps.createdAt };
    case SERVICE_ORDER_STATUSES.Released:
      return { stage: 'awaiting_start', anchorAt: timestamps.releasedAt ?? timestamps.updatedAt ?? timestamps.createdAt };
    case SERVICE_ORDER_STATUSES.InExecution:
      return { stage: 'in_execution', anchorAt: timestamps.startedAt ?? timestamps.updatedAt ?? timestamps.createdAt };
    case SERVICE_ORDER_STATUSES.Paused:
      return { stage: 'paused', anchorAt: timestamps.pausedAt ?? timestamps.updatedAt ?? timestamps.createdAt };
    default:
      return null;
  }
}

export function resolveMeasurementAgingAnchor(
  status: MeasurementStatus,
  timestamps: {
    submittedAt?: Date | string | null;
    reviewStartedAt?: Date | string | null;
    createdAt: Date | string;
  },
): OperationalAgingAnchor | null {
  if (TERMINAL_MEASUREMENT_STATUSES.has(status)) {
    return null;
  }

  if (status === MEASUREMENT_STATUSES.Submitted) {
    return { stage: 'awaiting_review', anchorAt: timestamps.submittedAt ?? timestamps.createdAt };
  }

  if (status === MEASUREMENT_STATUSES.UnderReview) {
    return {
      stage: 'awaiting_review',
      anchorAt: timestamps.reviewStartedAt ?? timestamps.submittedAt ?? timestamps.createdAt,
    };
  }

  return null;
}

export function computeOperationalAgeDays(
  anchor: OperationalAgingAnchor | null,
  now: Date,
): number | null {
  if (!anchor) {
    return null;
  }
  return ageInWholeDays(anchor.anchorAt, now);
}
