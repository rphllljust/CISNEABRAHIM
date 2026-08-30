import { assertUuid } from '../../catalog/domain/service-catalog.validation';
import { parseOptionalMoneyAmount } from '../../commercial/domain/money';

export class BillingValidationError extends Error {
  constructor(readonly field: string) {
    super(field);
  }
}

export type PrepareBillingRecordInput = {
  measurementId: string;
  paymentTerms: string;
  assertedTotalAmount?: string;
  idempotencyKey?: string;
};

export type VoidBillingRecordInput = {
  rowVersion: number;
  voidReason: string;
  idempotencyKey?: string;
};

export function validatePrepareBillingRecordInput(input: PrepareBillingRecordInput): PrepareBillingRecordInput {
  assertUuid(input.measurementId, 'measurementId');
  const paymentTerms = input.paymentTerms?.trim();
  if (!paymentTerms) {
    throw new BillingValidationError('paymentTerms');
  }
  if (input.idempotencyKey !== undefined && input.idempotencyKey.trim().length === 0) {
    throw new BillingValidationError('idempotencyKey');
  }
  let assertedTotalAmount: string | undefined;
  if (input.assertedTotalAmount !== undefined) {
    const parsed = parseOptionalMoneyAmount(input.assertedTotalAmount);
    if (!parsed) {
      throw new BillingValidationError('assertedTotalAmount');
    }
    assertedTotalAmount = parsed;
  }
  return {
    measurementId: input.measurementId,
    paymentTerms,
    assertedTotalAmount,
    idempotencyKey: input.idempotencyKey?.trim() || undefined,
  };
}

export function validateVoidBillingRecordInput(input: VoidBillingRecordInput): VoidBillingRecordInput {
  if (!Number.isInteger(input.rowVersion) || input.rowVersion < 1) {
    throw new BillingValidationError('rowVersion');
  }
  const voidReason = input.voidReason?.trim();
  if (!voidReason || voidReason.length < 3) {
    throw new BillingValidationError('voidReason');
  }
  if (input.idempotencyKey !== undefined && input.idempotencyKey.trim().length === 0) {
    throw new BillingValidationError('idempotencyKey');
  }
  return {
    rowVersion: input.rowVersion,
    voidReason,
    idempotencyKey: input.idempotencyKey?.trim() || undefined,
  };
}
