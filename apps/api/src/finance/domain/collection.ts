import { compareMoneyAmounts, isZeroMoneyAmount } from '../../platform/kernel/money-math';
import {
  RECEIVABLE_LIFECYCLES,
  RECEIVABLE_STATUSES,
  deriveReceivableStatus,
  remainingBalance,
} from './receivable';

export const COLLECTION_CASE_STATUSES = {
  Open: 'OPEN',
  Closed: 'CLOSED',
} as const;

export const COLLECTION_ACTION_KINDS = {
  Contact: 'CONTACT',
  Notice: 'NOTICE',
  PromiseToPay: 'PROMISE_TO_PAY',
  Renegotiation: 'RENEGOTIATION',
} as const;

export const COLLECTION_HISTORY_EVENTS = {
  CaseOpened: 'CASE_OPENED',
  ActionRecorded: 'ACTION_RECORDED',
  PromiseRecorded: 'PROMISE_RECORDED',
  Renegotiated: 'RENEGOTIATED',
  SettlementPartial: 'SETTLEMENT_PARTIAL',
  CaseClosedSettled: 'CASE_CLOSED_SETTLED',
} as const;

export class CollectionError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export function isReceivableOverdue(input: {
  lifecycle: string;
  principal: string;
  postedAmounts: string[];
  dueDate: string;
  asOf?: Date;
}): boolean {
  return (
    deriveReceivableStatus(input) === RECEIVABLE_STATUSES.Overdue
  );
}

export function assertCanOpenCollection(input: {
  lifecycle: string;
  principal: string;
  postedAmounts: string[];
  dueDate: string;
  asOf?: Date;
}): void {
  if (input.lifecycle !== RECEIVABLE_LIFECYCLES.Active) {
    throw new CollectionError('COLLECTION_NOT_OPENABLE');
  }
  const remaining = remainingBalance(input.principal, input.postedAmounts);
  if (isZeroMoneyAmount(remaining) || compareMoneyAmounts(remaining, '0') <= 0) {
    throw new CollectionError('COLLECTION_NOT_OPENABLE');
  }
  if (!isReceivableOverdue(input)) {
    throw new CollectionError('COLLECTION_NOT_OVERDUE');
  }
}

export function assertCollectionOpen(status: string): void {
  if (status !== COLLECTION_CASE_STATUSES.Open) {
    throw new CollectionError('COLLECTION_CLOSED');
  }
}

export function shouldCloseCollection(remaining: string): boolean {
  return isZeroMoneyAmount(remaining) || compareMoneyAmounts(remaining, '0') <= 0;
}
