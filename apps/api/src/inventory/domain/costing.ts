import { isPositiveMoneyAmount, normalizeMoneyAmount } from '../../platform/kernel/money-math';
import {
  COSTING_METHOD_STATUSES,
  STOCK_MOVEMENT_TYPES,
  InventoryError,
  assertCostingNotInvented,
  assertCostingUndecided,
  normalizeQuantity,
} from './inventory';

export const COSTING_RULE_STATUSES = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const;

export const COSTING_VERSION_STATUSES = {
  Draft: 'DRAFT',
  Published: 'PUBLISHED',
} as const;

export const STOCK_ORIGINS = {
  Receipt: 'RECEIPT',
  Issue: 'ISSUE',
  Transfer: 'TRANSFER',
  Adjustment: 'ADJUSTMENT',
  Reversal: 'REVERSAL',
} as const;

export type StockOriginKind = (typeof STOCK_ORIGINS)[keyof typeof STOCK_ORIGINS];

export type CostingSnapshot = {
  unitCost: string | null;
  totalCost: string | null;
  costingRuleVersionId: string | null;
  method: string;
};

const SCALE = 10_000n;

function toScaled(value: string): bigint {
  const normalized = normalizeMoneyAmount(value);
  const parts = normalized.split('.');
  return BigInt(parts[0] ?? '0') * SCALE + BigInt((parts[1] ?? '').padEnd(4, '0').slice(0, 4));
}

function fromScaled(value: bigint): string {
  const whole = value / SCALE;
  const fraction = (value % SCALE).toString().padStart(4, '0');
  return `${whole}.${fraction}`;
}

export function multiplyQuantityByUnitCost(quantity: string, unitCost: string): string {
  const product = toScaled(normalizeQuantity(quantity)) * toScaled(normalizeMoneyAmount(unitCost));
  return fromScaled((product + 5_000n) / SCALE);
}

export function originForMovement(input: {
  movementType: string;
  reversalOfMovementId?: string | null;
}): StockOriginKind {
  if (input.reversalOfMovementId) {
    return STOCK_ORIGINS.Reversal;
  }
  if (input.movementType === STOCK_MOVEMENT_TYPES.In) {
    return STOCK_ORIGINS.Receipt;
  }
  if (input.movementType === STOCK_MOVEMENT_TYPES.Out) {
    return STOCK_ORIGINS.Issue;
  }
  if (input.movementType === STOCK_MOVEMENT_TYPES.Transfer) {
    return STOCK_ORIGINS.Transfer;
  }
  if (input.movementType === STOCK_MOVEMENT_TYPES.Adjustment) {
    return STOCK_ORIGINS.Adjustment;
  }
  throw new InventoryError('INVENTORY_INVALID_MOVEMENT_TYPE');
}

export function applyExplicitCosting(input: {
  method: string;
  quantity: string;
  unitCost?: string | null;
  costingRuleVersionId: string | null;
}): CostingSnapshot {
  assertCostingUndecided(input.method);
  if (input.method !== COSTING_METHOD_STATUSES.Undecided) {
    return assertCostingNotInvented();
  }
  if (input.unitCost === undefined || input.unitCost === null || input.unitCost.trim() === '') {
    return {
      unitCost: null,
      totalCost: null,
      costingRuleVersionId: input.costingRuleVersionId,
      method: COSTING_METHOD_STATUSES.Undecided,
    };
  }
  if (!isPositiveMoneyAmount(input.unitCost)) {
    throw new InventoryError('INVENTORY_INVALID_COST');
  }
  const unitCost = normalizeMoneyAmount(input.unitCost);
  return {
    unitCost,
    totalCost: multiplyQuantityByUnitCost(input.quantity, unitCost),
    costingRuleVersionId: input.costingRuleVersionId,
    method: COSTING_METHOD_STATUSES.Undecided,
  };
}

export function reconcileExplicitCosts(
  movements: Array<{ quantity: string; unitCost: string | null; totalCost: string | null }>,
): boolean {
  return movements.every((movement) => {
    if (movement.unitCost === null && movement.totalCost === null) {
      return true;
    }
    if (movement.unitCost === null || movement.totalCost === null) {
      return false;
    }
    return (
      multiplyQuantityByUnitCost(movement.quantity, movement.unitCost) ===
      normalizeMoneyAmount(movement.totalCost)
    );
  });
}

export function publishedWindowsOverlap(
  left: { effectiveFrom: string; effectiveTo: string | null },
  right: { effectiveFrom: string; effectiveTo: string | null },
): boolean {
  const leftEnd = left.effectiveTo ?? '9999-12-31';
  const rightEnd = right.effectiveTo ?? '9999-12-31';
  return left.effectiveFrom <= rightEnd && right.effectiveFrom <= leftEnd;
}

export function assertPublishedCostingVersionImmutable(status: string): void {
  if (status === COSTING_VERSION_STATUSES.Published) {
    throw new InventoryError('INVENTORY_COSTING_VERSION_IMMUTABLE');
  }
}

export function assertCostingRuleConfigured(found: boolean): void {
  if (!found) {
    throw new InventoryError('INVENTORY_COSTING_RULE_NOT_CONFIGURED');
  }
}
