import { assertCurrencyCode, normalizeMoneyAmount } from '../../platform/kernel/money-math';
import { AccountingError } from './ledger';
import { assertUsefulLifeMonths } from './fixed-asset-accounting';

export type RegisterFixedAssetInput = {
  unitId: string;
  operationalAssetId: string;
  currencyCode: string;
  usefulLifeMonths: number;
  costCenterCode?: string | null;
};

export type AcquireFixedAssetInput = {
  amount: string;
  occurredOn: string;
  idempotencyKey?: string;
};

export type DisposeFixedAssetInput = {
  occurredOn: string;
  idempotencyKey?: string;
};

export type TransferFixedAssetInput = {
  toCostCenterCode: string;
  occurredOn: string;
  idempotencyKey?: string;
};

export type ReverseFixedAssetInput = {
  reason: string;
};

function requireNonEmpty(value: string | undefined | null, code: string): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    throw new AccountingError(code);
  }
  return trimmed;
}

function requireDate(value: string | undefined | null): string {
  const day = requireNonEmpty(value, 'ACCOUNTING_FIXED_ASSET_INVALID').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new AccountingError('ACCOUNTING_FIXED_ASSET_INVALID');
  }
  return day;
}

export function validateRegisterFixedAssetInput(input: RegisterFixedAssetInput): RegisterFixedAssetInput {
  return {
    unitId: requireNonEmpty(input.unitId, 'ACCOUNTING_FIXED_ASSET_INVALID'),
    operationalAssetId: requireNonEmpty(input.operationalAssetId, 'ACCOUNTING_FIXED_ASSET_INVALID'),
    currencyCode: assertCurrencyCode(input.currencyCode),
    usefulLifeMonths: assertUsefulLifeMonths(input.usefulLifeMonths),
    costCenterCode: input.costCenterCode?.trim() || null,
  };
}

export function validateAcquireFixedAssetInput(input: AcquireFixedAssetInput): AcquireFixedAssetInput {
  return {
    amount: normalizeMoneyAmount(requireNonEmpty(input.amount, 'ACCOUNTING_INVALID_AMOUNT')),
    occurredOn: requireDate(input.occurredOn),
    idempotencyKey: input.idempotencyKey?.trim() || undefined,
  };
}

export function validateDisposeFixedAssetInput(input: DisposeFixedAssetInput): DisposeFixedAssetInput {
  return {
    occurredOn: requireDate(input.occurredOn),
    idempotencyKey: input.idempotencyKey?.trim() || undefined,
  };
}

export function validateTransferFixedAssetInput(input: TransferFixedAssetInput): TransferFixedAssetInput {
  return {
    toCostCenterCode: requireNonEmpty(input.toCostCenterCode, 'ACCOUNTING_FIXED_ASSET_INVALID'),
    occurredOn: requireDate(input.occurredOn),
    idempotencyKey: input.idempotencyKey?.trim() || undefined,
  };
}

export function validateReverseFixedAssetInput(input: ReverseFixedAssetInput): ReverseFixedAssetInput {
  const reason = requireNonEmpty(input.reason, 'ACCOUNTING_FIXED_ASSET_INVALID');
  if (reason.length < 3) {
    throw new AccountingError('ACCOUNTING_FIXED_ASSET_INVALID');
  }
  return { reason };
}
