/**
 * Procurement Receiving — evolução do Receipt existente.
 *
 * Recebimento parcial, total, rejeição e devolução ao fornecedor. Somente
 * Receipt confirmado movimenta Inventory (quando aplicável); PurchaseOrder
 * NUNCA cria estoque diretamente. Over-receipt, devolução e duplicidade são
 * barradas. Three-way match compara pedido × recebido × faturado.
 */

import {
  ReceivingError,
  RECEIVING_ERROR_CODES,
} from './receiving-errors';

export const RECEIPT_CLASSIFICATIONS = {
  Partial: 'PARTIAL',
  Total: 'TOTAL',
  Rejection: 'REJECTION',
  Return: 'RETURN',
} as const;

export type ReceiptClassification =
  (typeof RECEIPT_CLASSIFICATIONS)[keyof typeof RECEIPT_CLASSIFICATIONS];

export type ReceiptLineInput = {
  lineNumber: number;
  itemId: string | null;
  orderedQuantity: string;
  receivedQuantity: string;
  rejectedQuantity: string;
  returnedQuantity: string;
};

export type ReceiptLineResult = ReceiptLineInput & {
  classification: ReceiptClassification;
  confirmed: boolean;
};

export type StockMovementInstruction = {
  kind: 'STOCK_MOVEMENT';
  source: 'RECEIPT';
  sourceRef: { receiptId: string; lineNumber: number };
  movementType: 'IN';
  itemId: string;
  quantity: string;
};

function toScaled(value: string): bigint {
  const [whole, fraction = ''] = String(value).trim().split('.');
  const padded = fraction.padEnd(4, '0').slice(0, 4);
  return BigInt(whole || '0') * 10_000n + BigInt(padded || '0');
}

function isZero(value: string): boolean {
  return toScaled(value) === 0n;
}

function isPositive(value: string): boolean {
  return toScaled(value) > 0n;
}

function assertNonNegativeQuantities(line: ReceiptLineInput): void {
  for (const qty of [line.orderedQuantity, line.receivedQuantity, line.rejectedQuantity, line.returnedQuantity]) {
    if (toScaled(qty) < 0n) {
      throw new ReceivingError(RECEIVING_ERROR_CODES.INVALID_QUANTITY);
    }
  }
}

export function classifyReceiptLine(line: ReceiptLineInput): ReceiptClassification {
  if (isPositive(line.returnedQuantity)) {
    return RECEIPT_CLASSIFICATIONS.Return;
  }
  if (isPositive(line.rejectedQuantity) && isZero(line.receivedQuantity)) {
    return RECEIPT_CLASSIFICATIONS.Rejection;
  }
  if (isPositive(line.receivedQuantity) && !isZero(line.receivedQuantity)) {
    const received = toScaled(line.receivedQuantity);
    const ordered = toScaled(line.orderedQuantity);
    return received === ordered ? RECEIPT_CLASSIFICATIONS.Total : RECEIPT_CLASSIFICATIONS.Partial;
  }
  throw new ReceivingError(RECEIVING_ERROR_CODES.INVALID_QUANTITY);
}

/** Over-receipt: recebido não pode exceder o pedido. */
export function assertNoOverReceipt(line: ReceiptLineInput): void {
  assertNonNegativeQuantities(line);
  if (toScaled(line.receivedQuantity) > toScaled(line.orderedQuantity)) {
    throw new ReceivingError(RECEIVING_ERROR_CODES.OVER_RECEIPT, String(line.lineNumber));
  }
}

/** Devolução exige recebimento prévio e não pode exceder o recebido. */
export function assertReturnAllowed(line: ReceiptLineInput): void {
  assertNonNegativeQuantities(line);
  if (!isPositive(line.returnedQuantity)) {
    return;
  }
  if (!isPositive(line.receivedQuantity)) {
    throw new ReceivingError(RECEIVING_ERROR_CODES.RETURN_WITHOUT_RECEIPT);
  }
  if (toScaled(line.returnedQuantity) > toScaled(line.receivedQuantity)) {
    throw new ReceivingError(RECEIVING_ERROR_CODES.RETURN_EXCEEDS_RECEIVED, String(line.lineNumber));
  }
}

/** Duplicidade: mesma (receiptId, lineNumber) não pode ser processada 2×. */
export function assertNoDuplicateReceipt(
  receiptId: string,
  lineNumber: number,
  processedKeys: readonly string[],
): void {
  const key = `${receiptId}:${lineNumber}`;
  if (processedKeys.includes(key)) {
    throw new ReceivingError(RECEIVING_ERROR_CODES.DUPLICATE_RECEIPT, key);
  }
}

/**
 * Avalia o recebimento completo (rollback-safe): qualquer linha inválida
 * aborta antes de emitir QUALQUER instrução. Receipt confirmado move estoque;
 * PurchaseOrder nunca cria estoque diretamente.
 */
export function evaluateReceiving(
  receiptId: string,
  lines: ReceiptLineInput[],
  options: { confirmed?: boolean; processedKeys?: readonly string[] } = {},
): { lines: ReceiptLineResult[]; stockMovements: StockMovementInstruction[] } {
  const confirmed = options.confirmed ?? false;
  const processedKeys = options.processedKeys ?? [];
  const results: ReceiptLineResult[] = [];
  const stockMovements: StockMovementInstruction[] = [];

  for (const line of lines) {
    assertNoOverReceipt(line);
    assertReturnAllowed(line);
    assertNoDuplicateReceipt(receiptId, line.lineNumber, processedKeys);
    const classification = classifyReceiptLine(line);
    results.push({ ...line, classification, confirmed });
    if (
      confirmed &&
      classification !== RECEIPT_CLASSIFICATIONS.Rejection &&
      classification !== RECEIPT_CLASSIFICATIONS.Return &&
      isPositive(line.receivedQuantity) &&
      line.itemId
    ) {
      stockMovements.push({
        kind: 'STOCK_MOVEMENT',
        source: 'RECEIPT',
        sourceRef: { receiptId, lineNumber: line.lineNumber },
        movementType: 'IN',
        itemId: line.itemId,
        quantity: line.receivedQuantity,
      });
    }
  }
  return { lines: results, stockMovements };
}

/** Garante que estoque só é criado por Receipt (nunca diretamente por PO). */
export function assertStockSourceIsReceipt(source: string): void {
  if (source !== 'RECEIPT') {
    throw new ReceivingError(RECEIVING_ERROR_CODES.STOCK_SOURCE_REQUIRED, source);
  }
}

export type ThreeWayMatchResult = {
  ok: boolean;
  reason: string;
};

/** Three-way match: pedido >= recebido >= faturado, e recebido == faturado. */
export function threeWayMatch(input: {
  orderedQuantity: string;
  receivedQuantity: string;
  invoicedQuantity: string;
}): ThreeWayMatchResult {
  const ordered = toScaled(input.orderedQuantity);
  const received = toScaled(input.receivedQuantity);
  const invoiced = toScaled(input.invoicedQuantity);
  if (invoiced > received) {
    return { ok: false, reason: 'INVOICED_EXCEEDS_RECEIVED' };
  }
  if (received > ordered) {
    return { ok: false, reason: 'RECEIVED_EXCEEDS_ORDERED' };
  }
  if (received !== invoiced) {
    return { ok: false, reason: 'RECEIVED_INVOICED_MISMATCH' };
  }
  return { ok: true, reason: 'MATCHED' };
}
