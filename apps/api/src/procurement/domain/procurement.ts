import {
  compareMoneyAmounts,
  isPositiveMoneyAmount,
  moneyAmountsEqual,
  normalizeMoneyAmount,
  subtractMoneyAmounts,
  sumMoneyAmounts,
} from '../../platform/kernel/money-math';

export const PURCHASE_REQUEST_STATUSES = {
  Draft: 'DRAFT',
  PendingApproval: 'PENDING_APPROVAL',
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
  Cancelled: 'CANCELLED',
} as const;

export const SUPPLIER_PURCHASE_ORDER_STATUSES = {
  Issued: 'ISSUED',
  PartiallyReceived: 'PARTIALLY_RECEIVED',
  Received: 'RECEIVED',
  Cancelled: 'CANCELLED',
} as const;

export const RECEIPT_STATUSES = {
  Posted: 'POSTED',
} as const;

export const APPROVAL_DECISIONS = {
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
} as const;

export class ProcurementError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

const SCALE = 10_000n;

function toScaled(value: string): bigint {
  const normalized = normalizeMoneyAmount(value);
  const [whole, fraction = ''] = normalized.split('.');
  return BigInt(whole ?? '0') * SCALE + BigInt(fraction.padEnd(4, '0').slice(0, 4));
}

function fromScaled(value: bigint): string {
  const whole = value / SCALE;
  const fraction = (value % SCALE).toString().padStart(4, '0').replace(/0+$/, '');
  return fraction.length > 0 ? `${whole}.${fraction}` : `${whole}`;
}

export function multiplyQuantityByUnitAmount(quantity: string, unitAmount: string): string {
  const product = toScaled(quantity) * toScaled(unitAmount);
  const rounded = (product + 5_000n) / SCALE;
  return fromScaled(rounded);
}

export function remainingQuantity(ordered: string, received: string): string {
  return subtractMoneyAmounts(normalizeMoneyAmount(ordered), normalizeMoneyAmount(received));
}

export function deriveSupplierPurchaseOrderStatus(ordered: string, received: string): string {
  if (compareMoneyAmounts(received, '0') <= 0) {
    return SUPPLIER_PURCHASE_ORDER_STATUSES.Issued;
  }
  if (moneyAmountsEqual(ordered, received)) {
    return SUPPLIER_PURCHASE_ORDER_STATUSES.Received;
  }
  if (compareMoneyAmounts(received, ordered) > 0) {
    throw new ProcurementError('PROCUREMENT_OVER_RECEIPT');
  }
  return SUPPLIER_PURCHASE_ORDER_STATUSES.PartiallyReceived;
}

export function assertReceiptDoesNotExceed(ordered: string, received: string, incoming: string): void {
  if (!isPositiveMoneyAmount(incoming)) {
    throw new ProcurementError('PROCUREMENT_INVALID');
  }
  const next = sumMoneyAmounts([received, incoming]);
  if (compareMoneyAmounts(next, ordered) > 0) {
    throw new ProcurementError('PROCUREMENT_OVER_RECEIPT');
  }
}

export function assertRequestCanSubmit(status: string): void {
  if (status !== PURCHASE_REQUEST_STATUSES.Draft) {
    throw new ProcurementError('PROCUREMENT_INVALID_STATE');
  }
}

export function assertRequestCanApprove(status: string): void {
  if (status !== PURCHASE_REQUEST_STATUSES.PendingApproval) {
    throw new ProcurementError('PROCUREMENT_INVALID_STATE');
  }
}

export function assertRequestCanIssue(status: string): void {
  if (status !== PURCHASE_REQUEST_STATUSES.Approved) {
    throw new ProcurementError('PROCUREMENT_NOT_APPROVED');
  }
}

export function assertRequestCanCancel(status: string, hasSupplierOrder: boolean): void {
  if (status === PURCHASE_REQUEST_STATUSES.Cancelled || status === PURCHASE_REQUEST_STATUSES.Rejected) {
    throw new ProcurementError('PROCUREMENT_INVALID_STATE');
  }
  if (hasSupplierOrder) {
    throw new ProcurementError('PROCUREMENT_HAS_ORDER');
  }
}

export function assertOrderCanReceive(status: string): void {
  if (
    status !== SUPPLIER_PURCHASE_ORDER_STATUSES.Issued &&
    status !== SUPPLIER_PURCHASE_ORDER_STATUSES.PartiallyReceived
  ) {
    throw new ProcurementError('PROCUREMENT_INVALID_STATE');
  }
}

export function assertOrderCanCancel(status: string, received: string): void {
  if (status === SUPPLIER_PURCHASE_ORDER_STATUSES.Cancelled) {
    throw new ProcurementError('PROCUREMENT_INVALID_STATE');
  }
  if (compareMoneyAmounts(received, '0') > 0) {
    throw new ProcurementError('PROCUREMENT_HAS_RECEIPTS');
  }
}
