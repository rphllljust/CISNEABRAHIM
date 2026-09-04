import { describe, expect, it } from 'vitest';
import { buildStockMovementPayload, type StockMovementDraft } from './movement-payload';

function draft(overrides: Partial<StockMovementDraft>): StockMovementDraft {
  return {
    unitId: 'unit-1',
    warehouseId: 'wh-1',
    inventoryItemId: 'item-1',
    movementType: 'IN',
    quantity: '5.0000',
    occurredOn: '2026-09-01',
    description: 'Movimento de teste',
    idempotencyKey: 'key-1',
    ...overrides,
  };
}

describe('buildStockMovementPayload', () => {
  it('keeps the IN payload unchanged (no transfer or adjustment fields)', () => {
    const payload = buildStockMovementPayload(draft({ movementType: 'IN' }));
    expect(payload).toEqual({
      unitId: 'unit-1',
      warehouseId: 'wh-1',
      inventoryItemId: 'item-1',
      movementType: 'IN',
      quantity: '5.0000',
      occurredOn: '2026-09-01',
      description: 'Movimento de teste',
      idempotencyKey: 'key-1',
    });
    expect('destinationWarehouseId' in payload).toBe(false);
    expect('adjustmentEffect' in payload).toBe(false);
  });

  it('keeps the OUT payload unchanged (no transfer or adjustment fields)', () => {
    const payload = buildStockMovementPayload(draft({ movementType: 'OUT' }));
    expect(payload.movementType).toBe('OUT');
    expect('destinationWarehouseId' in payload).toBe(false);
    expect('adjustmentEffect' in payload).toBe(false);
  });

  it('includes destinationWarehouseId and omits adjustmentEffect for TRANSFER', () => {
    const payload = buildStockMovementPayload(
      draft({
        movementType: 'TRANSFER',
        destinationWarehouseId: 'wh-2',
        adjustmentEffect: 'INCREASE',
      }),
    );
    expect(payload.destinationWarehouseId).toBe('wh-2');
    expect('adjustmentEffect' in payload).toBe(false);
  });

  it('throws when a TRANSFER has no destination warehouse', () => {
    expect(() =>
      buildStockMovementPayload(
        draft({ movementType: 'TRANSFER', destinationWarehouseId: '  ' }),
      ),
    ).toThrow(/destination/);
  });

  it('includes adjustmentEffect INCREASE and omits destinationWarehouseId for ADJUSTMENT', () => {
    const payload = buildStockMovementPayload(
      draft({
        movementType: 'ADJUSTMENT',
        adjustmentEffect: 'INCREASE',
        destinationWarehouseId: 'wh-2',
      }),
    );
    expect(payload.adjustmentEffect).toBe('INCREASE');
    expect('destinationWarehouseId' in payload).toBe(false);
  });

  it('includes adjustmentEffect DECREASE for ADJUSTMENT', () => {
    const payload = buildStockMovementPayload(
      draft({ movementType: 'ADJUSTMENT', adjustmentEffect: 'DECREASE' }),
    );
    expect(payload.adjustmentEffect).toBe('DECREASE');
  });

  it('throws when an ADJUSTMENT has an invalid effect', () => {
    expect(() =>
      buildStockMovementPayload(
        draft({ movementType: 'ADJUSTMENT', adjustmentEffect: 'UP' }),
      ),
    ).toThrow(/adjustmentEffect/);
  });
});
