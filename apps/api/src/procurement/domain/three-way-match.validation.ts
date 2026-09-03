import { assertUuid } from '../../platform/kernel/uuid';
import { ProcurementError } from './procurement';

export type ComputeThreeWayMatchInput = {
  idempotencyKey: string;
};

function requireText(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    throw new ProcurementError('PROCUREMENT_INVALID');
  }
  return trimmed;
}

export function validateComputeThreeWayMatchInput(
  orderId: string,
  input: ComputeThreeWayMatchInput,
): { orderId: string; idempotencyKey: string } {
  assertUuid(orderId, 'orderId');
  return {
    orderId,
    idempotencyKey: requireText(input.idempotencyKey),
  };
}
