import { describe, expect, it } from 'vitest';
import {
  assertNoOverReceipt,
  assertReturnAllowed,
  assertStockSourceIsReceipt,
  classifyReceiptLine,
  evaluateReceiving,
  threeWayMatch,
  type ReceiptLineInput,
} from './receiving';
import { RECEIVING_ERROR_CODES } from './receiving-errors';

function line(overrides: Partial<ReceiptLineInput> = {}): ReceiptLineInput {
  return {
    lineNumber: 1,
    itemId: 'item-1',
    orderedQuantity: '10',
    receivedQuantity: '4',
    rejectedQuantity: '0',
    returnedQuantity: '0',
    ...overrides,
  };
}

describe('procurement receiving', () => {
  it('partial: recebido < pedido classifica PARTIAL', () => {
    expect(classifyReceiptLine(line())).toBe('PARTIAL');
  });

  it('total: recebido == pedido classifica TOTAL; rejeição classifica REJECTION', () => {
    expect(classifyReceiptLine(line({ receivedQuantity: '10' }))).toBe('TOTAL');
    expect(classifyReceiptLine(line({ receivedQuantity: '0', rejectedQuantity: '10' }))).toBe('REJECTION');
  });

  it('over-receipt: recebido > pedido é barrado', () => {
    expect(() => assertNoOverReceipt(line({ receivedQuantity: '11' }))).toThrow(
      RECEIVING_ERROR_CODES.OVER_RECEIPT,
    );
  });

  it('return: devolução exige recebimento prévio e não excede o recebido', () => {
    expect(() => assertReturnAllowed(line({ returnedQuantity: '2', receivedQuantity: '4' }))).not.toThrow();
    expect(() => assertReturnAllowed(line({ returnedQuantity: '2', receivedQuantity: '0' }))).toThrow(
      RECEIVING_ERROR_CODES.RETURN_WITHOUT_RECEIPT,
    );
    expect(() => assertReturnAllowed(line({ returnedQuantity: '5', receivedQuantity: '4' }))).toThrow(
      RECEIVING_ERROR_CODES.RETURN_EXCEEDS_RECEIVED,
    );
  });

  it('duplicate receipt: mesma (receiptId, linha) bloqueada', () => {
    expect(() =>
      evaluateReceiving('rcv-1', [line()], { processedKeys: ['rcv-1:1'] }),
    ).toThrow(RECEIVING_ERROR_CODES.DUPLICATE_RECEIPT);
  });

  it('rollback: linha inválida aborta antes de emitir qualquer instrução', () => {
    expect(() =>
      evaluateReceiving('rcv-1', [line(), line({ lineNumber: 2, receivedQuantity: '99' })]),
    ).toThrow(RECEIVING_ERROR_CODES.OVER_RECEIPT);
  });

  it('efeito de estoque: só Receipt confirmado move Inventory; PO nunca cria estoque', () => {
    const unconfirmed = evaluateReceiving('rcv-1', [line()], { confirmed: false });
    expect(unconfirmed.stockMovements).toHaveLength(0);
    const confirmed = evaluateReceiving('rcv-1', [line()], { confirmed: true });
    expect(confirmed.stockMovements).toHaveLength(1);
    expect(confirmed.stockMovements[0]).toMatchObject({
      source: 'RECEIPT',
      movementType: 'IN',
      itemId: 'item-1',
      quantity: '4',
    });
    expect(() => assertStockSourceIsReceipt('PURCHASE_ORDER')).toThrow(
      RECEIVING_ERROR_CODES.STOCK_SOURCE_REQUIRED,
    );
    expect(() => assertStockSourceIsReceipt('RECEIPT')).not.toThrow();
  });

  it('three-way match: pedido >= recebido >= faturado e recebido == faturado', () => {
    expect(threeWayMatch({ orderedQuantity: '10', receivedQuantity: '10', invoicedQuantity: '10' })).toEqual({
      ok: true,
      reason: 'MATCHED',
    });
    expect(threeWayMatch({ orderedQuantity: '10', receivedQuantity: '10', invoicedQuantity: '11' }).ok).toBe(false);
    expect(threeWayMatch({ orderedQuantity: '10', receivedQuantity: '11', invoicedQuantity: '11' }).reason).toBe(
      'RECEIVED_EXCEEDS_ORDERED',
    );
    expect(threeWayMatch({ orderedQuantity: '10', receivedQuantity: '10', invoicedQuantity: '9' }).reason).toBe(
      'RECEIVED_INVOICED_MISMATCH',
    );
  });
});
