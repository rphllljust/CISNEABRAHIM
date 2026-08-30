import {
  SERVICE_ORDER_STATUSES,
  type ServiceOrderStatus,
} from './service-order';

export type ServiceOrderTransition =
  | 'prepare'
  | 'release'
  | 'cancel'
  | 'start'
  | 'pause'
  | 'resume'
  | 'complete';

export class ServiceOrderStateError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

const TRANSITIONS: Record<
  ServiceOrderTransition,
  { from: ServiceOrderStatus[]; to: ServiceOrderStatus }
> = {
  prepare: {
    from: [SERVICE_ORDER_STATUSES.Draft],
    to: SERVICE_ORDER_STATUSES.Prepared,
  },
  release: {
    from: [SERVICE_ORDER_STATUSES.Prepared],
    to: SERVICE_ORDER_STATUSES.Released,
  },
  cancel: {
    from: [
      SERVICE_ORDER_STATUSES.Draft,
      SERVICE_ORDER_STATUSES.Prepared,
      SERVICE_ORDER_STATUSES.Released,
    ],
    to: SERVICE_ORDER_STATUSES.Cancelled,
  },
  start: {
    from: [SERVICE_ORDER_STATUSES.Released],
    to: SERVICE_ORDER_STATUSES.InExecution,
  },
  pause: {
    from: [SERVICE_ORDER_STATUSES.InExecution],
    to: SERVICE_ORDER_STATUSES.Paused,
  },
  resume: {
    from: [SERVICE_ORDER_STATUSES.Paused],
    to: SERVICE_ORDER_STATUSES.InExecution,
  },
  complete: {
    from: [SERVICE_ORDER_STATUSES.InExecution],
    to: SERVICE_ORDER_STATUSES.Completed,
  },
};

export function assertTransition(
  currentStatus: ServiceOrderStatus,
  transition: ServiceOrderTransition,
): ServiceOrderStatus {
  const rule = TRANSITIONS[transition];
  if (!rule.from.includes(currentStatus)) {
    throw new ServiceOrderStateError('INVALID_STATE_TRANSITION');
  }
  return rule.to;
}

export function canTransition(
  currentStatus: ServiceOrderStatus,
  transition: ServiceOrderTransition,
): boolean {
  return TRANSITIONS[transition].from.includes(currentStatus);
}

export const TERMINAL_SERVICE_ORDER_STATUSES = new Set<ServiceOrderStatus>([
  SERVICE_ORDER_STATUSES.Completed,
  SERVICE_ORDER_STATUSES.Cancelled,
]);

export function isTerminalServiceOrderStatus(status: ServiceOrderStatus): boolean {
  return TERMINAL_SERVICE_ORDER_STATUSES.has(status);
}
