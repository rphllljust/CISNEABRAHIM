/**
 * Payload builder for POST /api/v1/inventory/movements.
 *
 * O backend (apps/api/src/inventory) espera um único comando com campos
 * condicionais por tipo de movimento:
 * - TRANSFER  → exige destinationWarehouseId (depósito de destino distinto);
 * - ADJUSTMENT → exige adjustmentEffect INCREASE | DECREASE;
 * - IN / OUT  → não envia destinationWarehouseId nem adjustmentEffect.
 */

export const ADJUSTMENT_EFFECTS = {
  Increase: 'INCREASE',
  Decrease: 'DECREASE',
} as const;

export type StockMovementType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';

export type StockMovementDraft = {
  unitId: string;
  warehouseId: string;
  inventoryItemId: string;
  movementType: StockMovementType;
  quantity: string;
  occurredOn: string;
  description: string;
  idempotencyKey: string;
  destinationWarehouseId?: string | null;
  adjustmentEffect?: string | null;
};

export function buildStockMovementPayload(
  draft: StockMovementDraft,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    unitId: draft.unitId,
    warehouseId: draft.warehouseId,
    inventoryItemId: draft.inventoryItemId,
    movementType: draft.movementType,
    quantity: draft.quantity,
    occurredOn: draft.occurredOn,
    description: draft.description,
    idempotencyKey: draft.idempotencyKey,
  };
  if (draft.movementType === 'TRANSFER') {
    const destinationWarehouseId = draft.destinationWarehouseId?.trim() ?? '';
    if (!destinationWarehouseId) {
      throw new Error('TRANSFER requires a destination warehouse (destinationWarehouseId).');
    }
    return { ...base, destinationWarehouseId };
  }
  if (draft.movementType === 'ADJUSTMENT') {
    const adjustmentEffect = draft.adjustmentEffect?.trim() ?? '';
    if (adjustmentEffect !== ADJUSTMENT_EFFECTS.Increase && adjustmentEffect !== ADJUSTMENT_EFFECTS.Decrease) {
      throw new Error('ADJUSTMENT requires adjustmentEffect INCREASE or DECREASE.');
    }
    return { ...base, adjustmentEffect };
  }
  return base;
}
