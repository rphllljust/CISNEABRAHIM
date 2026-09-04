import { describe, expect, it } from 'vitest';
import {
  integrateMaintenanceCosts,
  reconcileMaintenanceCosts,
  reverseMaintenanceCost,
  type MaintenanceOrderView,
} from './maintenance-cost-integration';
import { MAINTENANCE_COST_ERROR_CODES } from './maintenance-cost-errors';

function makeOrder(overrides: Partial<MaintenanceOrderView> = {}): MaintenanceOrderView {
  return {
    maintenanceOrderId: 'mo-1',
    assetId: 'asset-1',
    unitId: 'unit-1',
    lines: [
      { lineNumber: 1, kind: 'PART', itemId: 'item-p1', description: 'Filtro', quantity: '2.0000', unitCost: '50.0000', supplierId: null },
      { lineNumber: 2, kind: 'EXTERNAL_SERVICE', itemId: null, description: 'Mão de obra especializada', quantity: '1.0000', unitCost: '300.0000', supplierId: 'sup-1' },
    ],
    ...overrides,
  };
}

describe('maintenance cost integration', () => {
  it('peças: peça consumida gera movimento de estoque OUT com origem rastreável', () => {
    const result = integrateMaintenanceCosts(makeOrder());
    expect(result.stockMovements).toHaveLength(1);
    expect(result.stockMovements[0]).toMatchObject({
      originKind: 'MAINTENANCE_ORDER',
      movementType: 'OUT',
      itemId: 'item-p1',
      quantity: '2.0000',
      unitCost: '50.0000',
      originRef: { maintenanceOrderId: 'mo-1', lineNumber: 1 },
    });
  });

  it('serviço externo: gera payable com origem financeira rastreável', () => {
    const result = integrateMaintenanceCosts(makeOrder());
    expect(result.payables).toHaveLength(1);
    expect(result.payables[0]).toMatchObject({
      originKind: 'MAINTENANCE_ORDER',
      amount: '300',
      currencyCode: 'BRL',
      originRef: { maintenanceOrderId: 'mo-1', lineNumber: 2, supplierId: 'sup-1' },
    });
    expect(result.totalCost).toBe('400');
    expect(result.ledgerKeys).toEqual(['mo-1:1', 'mo-1:2']);
  });

  it('duplicidade: mesma ordem/linha não gera custo duas vezes (DUPLICATE COSTS 0)', () => {
    expect(() =>
      integrateMaintenanceCosts(makeOrder(), { existingLedgerKeys: ['mo-1:1'] }),
    ).toThrow(MAINTENANCE_COST_ERROR_CODES.DUPLICATE_COST);
    try {
      integrateMaintenanceCosts(makeOrder(), { existingLedgerKeys: ['mo-1:1'] });
      throw new Error('expected');
    } catch (error) {
      expect((error as { detail?: string }).detail).toBe('mo-1:1');
    }
  });

  it('reversal: lançamento compensatório e original preservado (idempotente)', () => {
    const order = makeOrder();
    const { compensation, reversedKey } = reverseMaintenanceCost(order, 1);
    expect(reversedKey).toBe('rev:mo-1:1');
    expect(compensation).toMatchObject({ kind: 'STOCK_MOVEMENT', quantity: '-2' });
    // Reverter de novo a mesma linha é barrado (duplicidade do reversal).
    expect(() => reverseMaintenanceCost(order, 1, { reversedLedgerKeys: ['rev:mo-1:1'] })).toThrow(
      MAINTENANCE_COST_ERROR_CODES.DUPLICATE_COST,
    );
    // Linha inexistente é rejeitada.
    expect(() => reverseMaintenanceCost(order, 9)).toThrow(MAINTENANCE_COST_ERROR_CODES.UNKNOWN_LINE);
  });

  it('reconciliação: soma registrada vs. custo total (balanceada/desbalanceada)', () => {
    const balanced = reconcileMaintenanceCosts(makeOrder(), ['100', '300']);
    expect(balanced).toMatchObject({ balanced: true, totalCost: '400', postedTotal: '400' });

    const unbalanced = reconcileMaintenanceCosts(makeOrder(), ['100', '250']);
    expect(unbalanced.balanced).toBe(false);
    expect(unbalanced.difference).toBe('50');
  });
});
