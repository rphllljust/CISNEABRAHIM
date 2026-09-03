import { isPositiveMoneyAmount, normalizeMoneyAmount } from '../../platform/kernel/money-math';

export const INVENTORY_ITEM_STATUSES = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const;

export const WAREHOUSE_STATUSES = {
  Active: 'ACTIVE',
  Inactive: 'INACTIVE',
} as const;

export const STOCK_MOVEMENT_TYPES = {
  In: 'IN',
  Out: 'OUT',
  Transfer: 'TRANSFER',
  Adjustment: 'ADJUSTMENT',
} as const;

export const STOCK_MOVEMENT_STATUSES = {
  Posted: 'POSTED',
  Reversed: 'REVERSED',
} as const;

export const TRANSFER_LEGS = {
  Origin: 'ORIGIN',
  Destination: 'DESTINATION',
} as const;

export const ADJUSTMENT_EFFECTS = {
  Increase: 'INCREASE',
  Decrease: 'DECREASE',
} as const;

export const RESERVATION_STATUSES = {
  Active: 'ACTIVE',
  Released: 'RELEASED',
  Consumed: 'CONSUMED',
  Cancelled: 'CANCELLED',
} as const;

/** Only UNDECIDED is stored. FIFO/average await a business/accounting decision. */
export const COSTING_METHOD_STATUSES = {
  Undecided: 'UNDECIDED',
} as const;

export class InventoryError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export type StockPosition = {
  onHand: string;
  reserved: string;
  available: string;
};

const SCALE = 10_000n;

function parseSignedQuantity(value: string): bigint {
  const trimmed = value.trim();
  const negative = trimmed.startsWith('-');
  const absolute = normalizeMoneyAmount(negative ? trimmed.slice(1) : trimmed);
  const parts = absolute.split('.');
  const whole = parts[0] ?? '0';
  const fraction = (parts[1] ?? '').padEnd(4, '0').slice(0, 4);
  const scaled = BigInt(whole) * SCALE + BigInt(fraction);
  return negative ? -scaled : scaled;
}

function formatSignedQuantity(value: bigint): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const whole = absolute / SCALE;
  const fraction = (absolute % SCALE).toString().padStart(4, '0');
  const formatted = `${whole}.${fraction}`;
  return negative ? `-${formatted}` : formatted;
}

export function normalizeQuantity(value: string): string {
  return normalizeMoneyAmount(value);
}

export function signedQuantityForMovement(input: {
  movementType: string;
  quantity: string;
  transferLeg?: string | null;
  adjustmentEffect?: string | null;
}): string {
  const quantity = normalizeQuantity(input.quantity);
  if (!isPositiveMoneyAmount(quantity)) {
    throw new InventoryError('INVENTORY_INVALID_QUANTITY');
  }
  if (input.movementType === STOCK_MOVEMENT_TYPES.In) {
    return quantity;
  }
  if (input.movementType === STOCK_MOVEMENT_TYPES.Out) {
    return formatSignedQuantity(-parseSignedQuantity(quantity));
  }
  if (input.movementType === STOCK_MOVEMENT_TYPES.Transfer) {
    if (input.transferLeg === TRANSFER_LEGS.Origin) {
      return formatSignedQuantity(-parseSignedQuantity(quantity));
    }
    if (input.transferLeg === TRANSFER_LEGS.Destination) {
      return quantity;
    }
    throw new InventoryError('INVENTORY_INVALID_TRANSFER');
  }
  if (input.movementType === STOCK_MOVEMENT_TYPES.Adjustment) {
    if (input.adjustmentEffect === ADJUSTMENT_EFFECTS.Increase) {
      return quantity;
    }
    if (input.adjustmentEffect === ADJUSTMENT_EFFECTS.Decrease) {
      return formatSignedQuantity(-parseSignedQuantity(quantity));
    }
    throw new InventoryError('INVENTORY_INVALID_ADJUSTMENT');
  }
  throw new InventoryError('INVENTORY_INVALID_MOVEMENT_TYPE');
}

export function deriveStockPosition(input: {
  postedSignedQuantities: string[];
  activeReservationQuantities: string[];
}): StockPosition {
  let onHand = 0n;
  for (const quantity of input.postedSignedQuantities) {
    onHand += parseSignedQuantity(quantity);
  }
  let reserved = 0n;
  for (const quantity of input.activeReservationQuantities) {
    reserved += parseSignedQuantity(quantity);
  }
  return {
    onHand: formatSignedQuantity(onHand),
    reserved: formatSignedQuantity(reserved),
    available: formatSignedQuantity(onHand - reserved),
  };
}

export function assertSufficientStock(input: {
  available: string;
  quantity: string;
  allowsNegativeStock: boolean;
}): void {
  if (input.allowsNegativeStock) {
    return;
  }
  if (parseSignedQuantity(input.available) < parseSignedQuantity(input.quantity)) {
    throw new InventoryError('INVENTORY_INSUFFICIENT_STOCK');
  }
}

export function assertNegativeStockUnauthorized(onHand: string): void {
  if (parseSignedQuantity(onHand) < 0n) {
    throw new InventoryError('INVENTORY_NEGATIVE_STOCK');
  }
}

export function assertCostingUndecided(status: string): void {
  if (status !== COSTING_METHOD_STATUSES.Undecided) {
    throw new InventoryError('INVENTORY_COST_METHOD_NOT_DECIDED');
  }
}

export function assertCostingNotInvented(): never {
  throw new InventoryError('INVENTORY_COST_METHOD_NOT_DECIDED');
}

export function reconcileOnHand(postedSignedQuantities: string[], reportedOnHand: string): boolean {
  const derived = deriveStockPosition({
    postedSignedQuantities,
    activeReservationQuantities: [],
  }).onHand;
  return parseSignedQuantity(derived) === parseSignedQuantity(reportedOnHand);
}
