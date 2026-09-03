import { isPositiveMoneyAmount } from '../../platform/kernel/money-math';
import { assertUuid } from '../../platform/kernel/uuid';
import {
  ADJUSTMENT_EFFECTS,
  STOCK_MOVEMENT_TYPES,
  InventoryError,
  normalizeQuantity,
} from './inventory';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class InventoryValidationError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export type CreateWarehouseInput = { unitId: string; code: string; name: string };
export type CreateInventoryItemInput = {
  unitId: string;
  sku: string;
  name: string;
  allowsNegativeStock?: boolean;
};
export type PostStockMovementInput = {
  unitId: string;
  warehouseId: string;
  inventoryItemId: string;
  movementType: string;
  quantity: string;
  occurredOn: string;
  description: string;
  idempotencyKey: string;
  destinationWarehouseId?: string | null;
  adjustmentEffect?: string | null;
  reservationId?: string | null;
  sourceKind?: string | null;
  sourceId?: string | null;
  unitCost?: string | null;
};
export type ReserveStockInput = {
  unitId: string;
  warehouseId: string;
  inventoryItemId: string;
  quantity: string;
  idempotencyKey: string;
  sourceKind?: string | null;
  sourceId?: string | null;
};

function requiredText(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new InventoryValidationError('INVENTORY_VALIDATION_FAILED');
  }
  return value.trim();
}

function requiredDate(value: unknown): string {
  const date = requiredText(value);
  if (!DATE_PATTERN.test(date)) {
    throw new InventoryValidationError('INVENTORY_VALIDATION_FAILED');
  }
  return date;
}

export function validateCreateWarehouseInput(input: CreateWarehouseInput): CreateWarehouseInput {
  return {
    unitId: requiredText(input.unitId),
    code: requiredText(input.code),
    name: requiredText(input.name),
  };
}

export function validateCreateInventoryItemInput(
  input: CreateInventoryItemInput,
): CreateInventoryItemInput {
  return {
    unitId: requiredText(input.unitId),
    sku: requiredText(input.sku),
    name: requiredText(input.name),
    allowsNegativeStock: input.allowsNegativeStock === true,
  };
}

export function validatePostStockMovementInput(
  input: PostStockMovementInput,
): PostStockMovementInput {
  const movementType = requiredText(input.movementType);
  if (!Object.values(STOCK_MOVEMENT_TYPES).includes(movementType as 'IN')) {
    throw new InventoryError('INVENTORY_INVALID_MOVEMENT_TYPE');
  }
  if (!isPositiveMoneyAmount(String(input.quantity))) {
    throw new InventoryError('INVENTORY_INVALID_QUANTITY');
  }
  const destinationWarehouseId =
    input.destinationWarehouseId === undefined ||
    input.destinationWarehouseId === null ||
    input.destinationWarehouseId === ''
      ? null
      : assertUuid(input.destinationWarehouseId, 'destinationWarehouseId');
  if (movementType === STOCK_MOVEMENT_TYPES.Transfer && !destinationWarehouseId) {
    throw new InventoryError('INVENTORY_INVALID_TRANSFER');
  }
  const adjustmentEffect =
    input.adjustmentEffect === undefined || input.adjustmentEffect === null || input.adjustmentEffect === ''
      ? null
      : requiredText(input.adjustmentEffect);
  if (movementType === STOCK_MOVEMENT_TYPES.Adjustment) {
    if (
      adjustmentEffect !== ADJUSTMENT_EFFECTS.Increase &&
      adjustmentEffect !== ADJUSTMENT_EFFECTS.Decrease
    ) {
      throw new InventoryError('INVENTORY_INVALID_ADJUSTMENT');
    }
  }
  const reservationId =
    input.reservationId === undefined || input.reservationId === null || input.reservationId === ''
      ? null
      : assertUuid(input.reservationId, 'reservationId');
  const sourceId =
    input.sourceId === undefined || input.sourceId === null || input.sourceId === ''
      ? null
      : assertUuid(input.sourceId, 'sourceId');
  const unitCost =
    input.unitCost === undefined || input.unitCost === null || input.unitCost === ''
      ? null
      : String(input.unitCost);
  if (unitCost !== null && !isPositiveMoneyAmount(unitCost)) {
    throw new InventoryError('INVENTORY_INVALID_COST');
  }
  return {
    unitId: requiredText(input.unitId),
    warehouseId: assertUuid(input.warehouseId, 'warehouseId'),
    inventoryItemId: assertUuid(input.inventoryItemId, 'inventoryItemId'),
    movementType,
    quantity: normalizeQuantity(String(input.quantity)),
    occurredOn: requiredDate(input.occurredOn),
    description: requiredText(input.description),
    idempotencyKey: requiredText(input.idempotencyKey),
    destinationWarehouseId,
    adjustmentEffect,
    reservationId,
    sourceKind: input.sourceKind ?? null,
    sourceId,
    unitCost,
  };
}

export function validateReserveStockInput(input: ReserveStockInput): ReserveStockInput {
  if (!isPositiveMoneyAmount(String(input.quantity))) {
    throw new InventoryError('INVENTORY_INVALID_QUANTITY');
  }
  return {
    unitId: requiredText(input.unitId),
    warehouseId: assertUuid(input.warehouseId, 'warehouseId'),
    inventoryItemId: assertUuid(input.inventoryItemId, 'inventoryItemId'),
    quantity: normalizeQuantity(String(input.quantity)),
    idempotencyKey: requiredText(input.idempotencyKey),
    sourceKind: input.sourceKind ?? null,
    sourceId:
      input.sourceId === undefined || input.sourceId === null || input.sourceId === ''
        ? null
        : assertUuid(input.sourceId, 'sourceId'),
  };
}
