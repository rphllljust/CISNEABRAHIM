import { isPositiveMoneyAmount, normalizeMoneyAmount } from '../../platform/kernel/money-math';

export const FISCAL_STATUSES = {
  Draft: 'DRAFT',
  Ready: 'READY',
  Submitted: 'SUBMITTED',
  Authorized: 'AUTHORIZED',
  Rejected: 'REJECTED',
  Cancelled: 'CANCELLED',
} as const;

export type FiscalStatus = (typeof FISCAL_STATUSES)[keyof typeof FISCAL_STATUSES];

export const FISCAL_PARTY_ROLES = {
  Issuer: 'ISSUER',
  Recipient: 'RECIPIENT',
} as const;

export const FISCAL_SOURCE_KINDS = {
  BillingDocument: 'BILLING_DOCUMENT',
  Manual: 'MANUAL',
  Receivable: 'RECEIVABLE',
  Other: 'OTHER',
} as const;

export const FISCAL_EVENT_TYPES = {
  Drafted: 'DRAFTED',
  Readied: 'READIED',
  Unreadied: 'UNREADIED',
  Submitted: 'SUBMITTED',
  Authorized: 'AUTHORIZED',
  Rejected: 'REJECTED',
  TimedOut: 'TIMED_OUT',
  Recovered: 'RECOVERED',
  Revised: 'REVISED',
  Cancelled: 'CANCELLED',
} as const;

export const FISCAL_GATEWAY_OUTCOMES = {
  Authorized: 'AUTHORIZED',
  Rejected: 'REJECTED',
  Timeout: 'TIMEOUT',
} as const;

export const ALLOWED_FISCAL_TRANSITIONS: Record<FiscalStatus, readonly FiscalStatus[]> = {
  DRAFT: ['READY'],
  READY: ['DRAFT', 'SUBMITTED'],
  SUBMITTED: ['AUTHORIZED', 'REJECTED', 'SUBMITTED'],
  AUTHORIZED: ['CANCELLED'],
  REJECTED: ['DRAFT'],
  CANCELLED: [],
};

export class FiscalError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export type FiscalPartyDraft = {
  role: string;
  legalName: string;
  taxIdentifier: string;
  partySnapshot?: Record<string, unknown>;
};

export type FiscalItemDraft = {
  lineNumber: number;
  description: string;
  quantity: string;
  unitAmount: string;
  lineAmount: string;
  itemSnapshot?: Record<string, unknown>;
};

export type FiscalTaxDetailDraft = {
  lineNumber: number;
  componentLabel: string;
  amount: string;
  detailSnapshot?: Record<string, unknown>;
};

export function assertFiscalStatus(value: string): FiscalStatus {
  if (!Object.values(FISCAL_STATUSES).includes(value as FiscalStatus)) {
    throw new FiscalError('FISCAL_INVALID_STATUS');
  }
  return value as FiscalStatus;
}

export function assertSourceKind(value: string): string {
  if (!Object.values(FISCAL_SOURCE_KINDS).includes(value as (typeof FISCAL_SOURCE_KINDS)[keyof typeof FISCAL_SOURCE_KINDS])) {
    throw new FiscalError('FISCAL_INVALID_SOURCE');
  }
  return value;
}

export function assertTransition(from: string, to: string): void {
  const current = assertFiscalStatus(from);
  const next = assertFiscalStatus(to);
  if (!ALLOWED_FISCAL_TRANSITIONS[current].includes(next)) {
    throw new FiscalError('FISCAL_INVALID_TRANSITION');
  }
}

export function assertPayloadMutable(status: string): void {
  if (status !== FISCAL_STATUSES.Draft) {
    throw new FiscalError('FISCAL_DOCUMENT_IMMUTABLE');
  }
}

export function assertNotTerminal(status: string): void {
  if (status === FISCAL_STATUSES.Authorized || status === FISCAL_STATUSES.Cancelled) {
    throw new FiscalError('FISCAL_DOCUMENT_IMMUTABLE');
  }
}

export function nextStatusFromGateway(outcome: string): FiscalStatus {
  if (outcome === FISCAL_GATEWAY_OUTCOMES.Authorized) {
    return FISCAL_STATUSES.Authorized;
  }
  if (outcome === FISCAL_GATEWAY_OUTCOMES.Rejected) {
    return FISCAL_STATUSES.Rejected;
  }
  if (outcome === FISCAL_GATEWAY_OUTCOMES.Timeout) {
    return FISCAL_STATUSES.Submitted;
  }
  throw new FiscalError('FISCAL_INVALID_GATEWAY_OUTCOME');
}

export function eventTypeForStatus(status: string): string {
  switch (status) {
    case FISCAL_STATUSES.Ready:
      return FISCAL_EVENT_TYPES.Readied;
    case FISCAL_STATUSES.Submitted:
      return FISCAL_EVENT_TYPES.Submitted;
    case FISCAL_STATUSES.Authorized:
      return FISCAL_EVENT_TYPES.Authorized;
    case FISCAL_STATUSES.Rejected:
      return FISCAL_EVENT_TYPES.Rejected;
    case FISCAL_STATUSES.Cancelled:
      return FISCAL_EVENT_TYPES.Cancelled;
    case FISCAL_STATUSES.Draft:
      return FISCAL_EVENT_TYPES.Revised;
    default:
      throw new FiscalError('FISCAL_INVALID_STATUS');
  }
}

export function assertParties(parties: FiscalPartyDraft[]): void {
  const roles = parties.map((party) => party.role);
  if (
    roles.filter((role) => role === FISCAL_PARTY_ROLES.Issuer).length !== 1 ||
    roles.filter((role) => role === FISCAL_PARTY_ROLES.Recipient).length !== 1
  ) {
    throw new FiscalError('FISCAL_PARTIES_REQUIRED');
  }
  for (const party of parties) {
    if (!party.legalName.trim() || !party.taxIdentifier.trim()) {
      throw new FiscalError('FISCAL_PARTY_SNAPSHOT_INVALID');
    }
  }
}

export function assertItems(items: FiscalItemDraft[]): void {
  if (items.length < 1) {
    throw new FiscalError('FISCAL_ITEMS_REQUIRED');
  }
  const numbers = new Set<number>();
  for (const item of items) {
    if (item.lineNumber < 1 || numbers.has(item.lineNumber) || !item.description.trim()) {
      throw new FiscalError('FISCAL_INVALID_ITEM');
    }
    numbers.add(item.lineNumber);
    for (const amount of [item.quantity, item.unitAmount, item.lineAmount]) {
      const normalized = normalizeMoneyAmount(amount);
      if (!isPositiveMoneyAmount(normalized)) {
        throw new FiscalError('FISCAL_INVALID_AMOUNT');
      }
    }
  }
}

export function assertTaxDetails(details: FiscalTaxDetailDraft[]): void {
  const numbers = new Set<number>();
  for (const detail of details) {
    if (detail.lineNumber < 1 || numbers.has(detail.lineNumber) || !detail.componentLabel.trim()) {
      throw new FiscalError('FISCAL_INVALID_TAX_SNAPSHOT');
    }
    numbers.add(detail.lineNumber);
    if (!isPositiveMoneyAmount(normalizeMoneyAmount(detail.amount))) {
      throw new FiscalError('FISCAL_INVALID_AMOUNT');
    }
  }
}
