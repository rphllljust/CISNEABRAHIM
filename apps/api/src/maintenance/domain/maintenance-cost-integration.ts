/**
 * Maintenance Cost Integration — integra MaintenanceOrder com Inventory,
 * Payables, Expenses e Accounting sem duplicar custo.
 *
 * Interpretação de engenharia:
 *  - Peça consumida gera movimento de estoque (OUT) com origem rastreável
 *    (kind MAINTENANCE_ORDER + maintenanceOrderId + lineNumber).
 *  - Serviço externo gera Payable com origem financeira rastreável.
 *  - Ledger de custo por (maintenanceOrderId, lineNumber): DUPLICATE COSTS 0.
 *  - Reversal gera lançamentos compensatórios (nunca apaga o original).
 *  - Reconciliação soma custos vs. ledger registrado.
 * Nenhum cadastro de Inventory/Payable/Expense/Accounting é duplicado — apenas
 * instruções de integração para os fluxos existentes.
 */

import {
  MaintenanceCostError,
  MAINTENANCE_COST_ERROR_CODES,
} from './maintenance-cost-errors';

export const MAINTENANCE_LINE_KINDS = {
  Part: 'PART',
  ExternalService: 'EXTERNAL_SERVICE',
} as const;

export type MaintenanceLineKind =
  (typeof MAINTENANCE_LINE_KINDS)[keyof typeof MAINTENANCE_LINE_KINDS];

export type MaintenanceOrderLine = {
  lineNumber: number;
  kind: MaintenanceLineKind;
  itemId: string | null;
  description: string;
  quantity: string;
  unitCost: string;
  supplierId: string | null;
};

export type MaintenanceOrderView = {
  maintenanceOrderId: string;
  assetId: string;
  unitId: string;
  lines: MaintenanceOrderLine[];
};

export type MaintenanceCostLedgerEntry = {
  key: string;
  amount: string;
};

export type StockMovementInstruction = {
  kind: 'STOCK_MOVEMENT';
  originKind: 'MAINTENANCE_ORDER';
  originRef: { maintenanceOrderId: string; lineNumber: number; itemId: string | null };
  movementType: 'OUT';
  itemId: string;
  quantity: string;
  unitCost: string;
};

export type PayableInstruction = {
  kind: 'PAYABLE';
  originKind: 'MAINTENANCE_ORDER';
  originRef: { maintenanceOrderId: string; lineNumber: number; supplierId: string | null };
  amount: string;
  currencyCode: string;
};

export type MaintenanceCostIntegrationResult = {
  orderId: string;
  stockMovements: StockMovementInstruction[];
  payables: PayableInstruction[];
  ledgerKeys: string[];
  totalCost: string;
};

function ledgerKey(maintenanceOrderId: string, lineNumber: number): string {
  return `${maintenanceOrderId}:${lineNumber}`;
}

function assertLineValid(line: MaintenanceOrderLine): void {
  if (!Number.isInteger(line.lineNumber) || line.lineNumber < 1) {
    throw new MaintenanceCostError(MAINTENANCE_COST_ERROR_CODES.INVALID_LINE);
  }
  if (line.kind === MAINTENANCE_LINE_KINDS.Part && !line.itemId) {
    throw new MaintenanceCostError(MAINTENANCE_COST_ERROR_CODES.INVALID_LINE);
  }
}

function assertNotAlreadyCosted(
  existingKeys: readonly string[],
  key: string,
): void {
  if (existingKeys.includes(key)) {
    throw new MaintenanceCostError(MAINTENANCE_COST_ERROR_CODES.DUPLICATE_COST, key);
  }
}

/** Gera instruções de custo (peça → estoque; serviço externo → payable). */
export function integrateMaintenanceCosts(
  order: MaintenanceOrderView,
  options: { existingLedgerKeys?: readonly string[]; currencyCode?: string } = {},
): MaintenanceCostIntegrationResult {
  const existingKeys = options.existingLedgerKeys ?? [];
  const currencyCode = options.currencyCode ?? 'BRL';
  const stockMovements: StockMovementInstruction[] = [];
  const payables: PayableInstruction[] = [];
  const ledgerKeys: string[] = [];
  let totalCost = '0';

  for (const line of order.lines) {
    assertLineValid(line);
    const key = ledgerKey(order.maintenanceOrderId, line.lineNumber);
    assertNotAlreadyCosted(existingKeys, key);
    const amount = multiplyQuantityUnitCost(line.quantity, line.unitCost);

    if (line.kind === MAINTENANCE_LINE_KINDS.Part) {
      stockMovements.push({
        kind: 'STOCK_MOVEMENT',
        originKind: 'MAINTENANCE_ORDER',
        originRef: { maintenanceOrderId: order.maintenanceOrderId, lineNumber: line.lineNumber, itemId: line.itemId },
        movementType: 'OUT',
        itemId: line.itemId!,
        quantity: line.quantity,
        unitCost: line.unitCost,
      });
    } else {
      payables.push({
        kind: 'PAYABLE',
        originKind: 'MAINTENANCE_ORDER',
        originRef: { maintenanceOrderId: order.maintenanceOrderId, lineNumber: line.lineNumber, supplierId: line.supplierId },
        amount,
        currencyCode,
      });
    }

    ledgerKeys.push(key);
    totalCost = sumAmounts(totalCost, amount);
  }

  return { orderId: order.maintenanceOrderId, stockMovements, payables, ledgerKeys, totalCost };
}

/** Reversal: lançamentos compensatórios idempotentes; original nunca é apagado. */
export function reverseMaintenanceCost(
  order: MaintenanceOrderView,
  lineNumber: number,
  options: { reversedLedgerKeys?: readonly string[] } = {},
): { compensation: StockMovementInstruction | PayableInstruction; reversedKey: string } {
  const line = order.lines.find((entry) => entry.lineNumber === lineNumber);
  if (!line) {
    throw new MaintenanceCostError(MAINTENANCE_COST_ERROR_CODES.UNKNOWN_LINE, String(lineNumber));
  }
  const reversedKey = `rev:${ledgerKey(order.maintenanceOrderId, lineNumber)}`;
  if (options.reversedLedgerKeys?.includes(reversedKey)) {
    throw new MaintenanceCostError(MAINTENANCE_COST_ERROR_CODES.DUPLICATE_COST, reversedKey);
  }
  const amount = multiplyQuantityUnitCost(line.quantity, line.unitCost);
  const compensation: StockMovementInstruction | PayableInstruction =
    line.kind === MAINTENANCE_LINE_KINDS.Part
      ? {
          kind: 'STOCK_MOVEMENT',
          originKind: 'MAINTENANCE_ORDER',
          originRef: { maintenanceOrderId: order.maintenanceOrderId, lineNumber, itemId: line.itemId },
          movementType: 'OUT',
          itemId: line.itemId!,
          quantity: negateQuantity(line.quantity),
          unitCost: line.unitCost,
        }
      : {
          kind: 'PAYABLE',
          originKind: 'MAINTENANCE_ORDER',
          originRef: { maintenanceOrderId: order.maintenanceOrderId, lineNumber, supplierId: line.supplierId },
          amount: negateAmount(amount),
          currencyCode: 'BRL',
        };
  return { compensation, reversedKey };
}

/** Reconciliação: soma dos lançamentos registrados vs. custo total da ordem. */
export function reconcileMaintenanceCosts(
  order: MaintenanceOrderView,
  postedAmounts: readonly string[],
): { balanced: boolean; totalCost: string; postedTotal: string; difference: string } {
  const totalCost = order.lines.reduce(
    (sum, line) => sumAmounts(sum, multiplyQuantityUnitCost(line.quantity, line.unitCost)),
    '0',
  );
  const postedTotal = postedAmounts.reduce((sum, amount) => sumAmounts(sum, amount), '0');
  const difference = subtractAmounts(totalCost, postedTotal);
  return {
    balanced: isZero(difference),
    totalCost,
    postedTotal,
    difference,
  };
}

function toScaled(value: string): bigint {
  const [whole, fraction = ''] = String(value).trim().split('.');
  const padded = fraction.padEnd(4, '0').slice(0, 4);
  return BigInt(whole || '0') * 10_000n + BigInt(padded || '0');
}

function fromScaled(value: bigint): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const whole = abs / 10_000n;
  const fraction = (abs % 10_000n).toString().padStart(4, '0').replace(/0+$/, '');
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}

function multiplyQuantityUnitCost(quantity: string, unitCost: string): string {
  return fromScaled(toScaled(quantity) * toScaled(unitCost) / 10_000n);
}

function sumAmounts(left: string, right: string): string {
  return fromScaled(toScaled(left) + toScaled(right));
}

function subtractAmounts(left: string, right: string): string {
  return fromScaled(toScaled(left) - toScaled(right));
}

function isZero(value: string): boolean {
  return toScaled(value) === 0n;
}

function negateAmount(value: string): string {
  return fromScaled(-toScaled(value));
}

function negateQuantity(value: string): string {
  return fromScaled(-toScaled(value));
}
