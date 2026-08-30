import {
  SERVICE_ORDER_STATUSES,
  type ServiceOrderStatus,
} from '../../service-orders/domain/service-order';
import { isTerminalServiceOrderStatus } from '../../service-orders/domain/service-order.state-machine';

export type ServiceOrderOverdueInput = {
  status: ServiceOrderStatus;
  deadline: Date | string | null | undefined;
  now: Date;
};

export type ServiceOrderOverdueEvaluation = {
  overdue: boolean;
  delayDays: number | null;
};

/**
 * Derived overdue condition — never mutates service order status.
 * deadline < now AND status is not terminal per the real state machine.
 */
export function evaluateServiceOrderOverdue(input: ServiceOrderOverdueInput): ServiceOrderOverdueEvaluation {
  if (isTerminalServiceOrderStatus(input.status)) {
    return { overdue: false, delayDays: null };
  }

  if (!input.deadline) {
    return { overdue: false, delayDays: null };
  }

  const deadline = typeof input.deadline === 'string' ? new Date(input.deadline) : input.deadline;
  if (Number.isNaN(deadline.getTime())) {
    return { overdue: false, delayDays: null };
  }

  const nowMs = input.now.getTime();
  const deadlineMs = deadline.getTime();

  if (deadlineMs > nowMs) {
    return { overdue: false, delayDays: null };
  }

  const delayMs = nowMs - deadlineMs;
  return {
    overdue: true,
    delayDays: Math.floor(delayMs / 86_400_000),
  };
}

export function isServiceOrderApproachingDue(input: {
  status: ServiceOrderStatus;
  deadline: Date | string | null | undefined;
  now: Date;
  thresholdDays: number;
}): boolean {
  if (isTerminalServiceOrderStatus(input.status) || !input.deadline || input.thresholdDays < 0) {
    return false;
  }
  const deadline = typeof input.deadline === 'string' ? new Date(input.deadline) : input.deadline;
  if (Number.isNaN(deadline.getTime())) {
    return false;
  }
  const remainingMs = deadline.getTime() - input.now.getTime();
  if (remainingMs < 0) {
    return false;
  }
  const remainingDays = Math.ceil(remainingMs / 86_400_000);
  return remainingDays <= input.thresholdDays;
}

export const NON_OVERDUE_ACTIVE_STATUSES = new Set<ServiceOrderStatus>([
  SERVICE_ORDER_STATUSES.Draft,
  SERVICE_ORDER_STATUSES.Prepared,
  SERVICE_ORDER_STATUSES.Released,
  SERVICE_ORDER_STATUSES.InExecution,
  SERVICE_ORDER_STATUSES.Paused,
]);
