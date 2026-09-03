import { assertUuid } from '../../platform/kernel/uuid';
import { assertCurrencyCode, normalizeMoneyAmount } from '../../platform/kernel/money-math';
import {
  FINANCIAL_ACCOUNT_KINDS,
  TreasuryError,
  assertAccountKind,
  assertDirection,
  assertTreasuryAmount,
  assertTreasuryOriginKind,
} from './treasury';

export class TreasuryValidationError extends Error {
  constructor(readonly field: string) {
    super(field);
  }
}

export type OpenFinancialAccountInput = {
  unitId: string;
  kind: string;
  code: string;
  name: string;
  currencyCode: string;
  overdraftAllowed?: boolean;
  openingAmount?: string;
  bank?: { bankCode: string; agency: string; accountNumber: string };
  cash?: { locationCode: string };
};

export type PostTreasuryMovementInput = {
  direction: string;
  amount: string;
  rowVersion: number;
  idempotencyKey: string;
  reference: string;
  originKind: string;
  originId: string;
  originReference: string;
  occurredAt?: string;
};

export type TransferTreasuryInput = {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  rowVersionFrom: number;
  rowVersionTo: number;
  idempotencyKey: string;
  reference: string;
  originId: string;
  originReference: string;
  occurredAt?: string;
};

export type ReverseTreasuryInput = {
  rowVersion: number;
  idempotencyKey: string;
  reference: string;
  reason: string;
  amount?: string;
};

function requireNonEmpty(value: string | undefined | null, field: string): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    throw new TreasuryValidationError(field);
  }
  return trimmed;
}

export function validateOpenFinancialAccountInput(
  input: OpenFinancialAccountInput,
): OpenFinancialAccountInput {
  const unitId = requireNonEmpty(input.unitId, 'unitId');
  let kind: string;
  try {
    kind = assertAccountKind(input.kind);
  } catch {
    throw new TreasuryValidationError('kind');
  }
  const code = requireNonEmpty(input.code, 'code');
  const name = requireNonEmpty(input.name, 'name');
  let currencyCode: string;
  try {
    currencyCode = assertCurrencyCode(input.currencyCode);
  } catch {
    throw new TreasuryValidationError('currencyCode');
  }
  if (input.openingAmount !== undefined) {
    try {
      assertTreasuryAmount(input.openingAmount);
    } catch {
      throw new TreasuryValidationError('openingAmount');
    }
  }
  if (kind === FINANCIAL_ACCOUNT_KINDS.Bank) {
    if (!input.bank) {
      throw new TreasuryValidationError('bank');
    }
    return {
      unitId,
      kind,
      code,
      name,
      currencyCode,
      overdraftAllowed: input.overdraftAllowed === true,
      openingAmount: input.openingAmount,
      bank: {
        bankCode: requireNonEmpty(input.bank.bankCode, 'bank.bankCode'),
        agency: requireNonEmpty(input.bank.agency, 'bank.agency'),
        accountNumber: requireNonEmpty(input.bank.accountNumber, 'bank.accountNumber'),
      },
    };
  }
  if (!input.cash) {
    throw new TreasuryValidationError('cash');
  }
  return {
    unitId,
    kind,
    code,
    name,
    currencyCode,
    overdraftAllowed: input.overdraftAllowed === true,
    openingAmount: input.openingAmount,
    cash: {
      locationCode: requireNonEmpty(input.cash.locationCode, 'cash.locationCode'),
    },
  };
}

export function validatePostTreasuryMovementInput(
  input: PostTreasuryMovementInput,
): PostTreasuryMovementInput {
  if (!Number.isInteger(input.rowVersion) || input.rowVersion < 1) {
    throw new TreasuryValidationError('rowVersion');
  }
  let direction: string;
  try {
    direction = assertDirection(input.direction);
  } catch {
    throw new TreasuryValidationError('direction');
  }
  let amount: string;
  try {
    amount = assertTreasuryAmount(input.amount);
  } catch {
    throw new TreasuryValidationError('amount');
  }
  let originKind: string;
  try {
    originKind = assertTreasuryOriginKind(input.originKind);
  } catch (error) {
    if (error instanceof TreasuryError) {
      throw error;
    }
    throw new TreasuryValidationError('originKind');
  }
  if (originKind === 'TRANSFER' || originKind === 'REVERSAL') {
    throw new TreasuryValidationError('originKind');
  }
  assertUuid(input.originId, 'originId');
  if (input.occurredAt !== undefined && Number.isNaN(Date.parse(input.occurredAt))) {
    throw new TreasuryValidationError('occurredAt');
  }
  return {
    direction,
    amount,
    rowVersion: input.rowVersion,
    idempotencyKey: requireNonEmpty(input.idempotencyKey, 'idempotencyKey'),
    reference: requireNonEmpty(input.reference, 'reference'),
    originKind,
    originId: input.originId,
    originReference: requireNonEmpty(input.originReference, 'originReference'),
    occurredAt: input.occurredAt,
  };
}

export function validateTransferTreasuryInput(input: TransferTreasuryInput): TransferTreasuryInput {
  assertUuid(input.fromAccountId, 'fromAccountId');
  assertUuid(input.toAccountId, 'toAccountId');
  if (input.fromAccountId === input.toAccountId) {
    throw new TreasuryError('TREASURY_SAME_ACCOUNT_TRANSFER');
  }
  if (!Number.isInteger(input.rowVersionFrom) || input.rowVersionFrom < 1) {
    throw new TreasuryValidationError('rowVersionFrom');
  }
  if (!Number.isInteger(input.rowVersionTo) || input.rowVersionTo < 1) {
    throw new TreasuryValidationError('rowVersionTo');
  }
  let amount: string;
  try {
    amount = assertTreasuryAmount(input.amount);
  } catch {
    throw new TreasuryValidationError('amount');
  }
  assertUuid(input.originId, 'originId');
  if (input.occurredAt !== undefined && Number.isNaN(Date.parse(input.occurredAt))) {
    throw new TreasuryValidationError('occurredAt');
  }
  return {
    fromAccountId: input.fromAccountId,
    toAccountId: input.toAccountId,
    amount,
    rowVersionFrom: input.rowVersionFrom,
    rowVersionTo: input.rowVersionTo,
    idempotencyKey: requireNonEmpty(input.idempotencyKey, 'idempotencyKey'),
    reference: requireNonEmpty(input.reference, 'reference'),
    originId: input.originId,
    originReference: requireNonEmpty(input.originReference, 'originReference'),
    occurredAt: input.occurredAt,
  };
}

export function validateReverseTreasuryInput(input: ReverseTreasuryInput): ReverseTreasuryInput {
  if (!Number.isInteger(input.rowVersion) || input.rowVersion < 1) {
    throw new TreasuryValidationError('rowVersion');
  }
  const reason = requireNonEmpty(input.reason, 'reason');
  if (reason.length < 3) {
    throw new TreasuryValidationError('reason');
  }
  if (input.amount !== undefined) {
    try {
      assertTreasuryAmount(input.amount);
    } catch {
      throw new TreasuryValidationError('amount');
    }
  }
  return {
    rowVersion: input.rowVersion,
    idempotencyKey: requireNonEmpty(input.idempotencyKey, 'idempotencyKey'),
    reference: requireNonEmpty(input.reference, 'reference'),
    reason,
    amount: input.amount,
  };
}

export function normalizeOpeningAmount(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }
  return normalizeMoneyAmount(value);
}
