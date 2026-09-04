/**
 * Partial receiving payload builder for supplier purchase orders.
 *
 * Regras espelham o contrato do backend (apps/api/src/procurement):
 * - cada linha recebida precisa de quantidade positiva (string decimal);
 * - o recebimento não pode exceder o saldo a receber da linha
 *   (orderedQuantity - receivedQuantity acumulado);
 * - linhas com quantidade vazia/zero são omitidas do payload;
 * - ao menos uma linha com quantidade positiva é obrigatória.
 */

export type ReceiveOrderLine = {
  id: string;
  lineNumber?: number;
  orderedQuantity: string;
  receivedQuantity: string;
};

export type ReceivePayloadLine = {
  spoLineId: string;
  quantity: string;
};

export type PartialReceiveResult = {
  valid: boolean;
  issues: string[];
  payload: ReceivePayloadLine[];
  totalQuantity: string;
};

const SCALE = 10_000n;

/** '12.3456' → scaled integer. Returns null when the string is not a valid quantity. */
function toScaled(value: string): bigint | null {
  const trimmed = value.trim();
  if (!/^\d+(?:\.\d{1,4})?$/.test(trimmed)) {
    return null;
  }
  const [whole = '0', fraction = ''] = trimmed.split('.');
  return BigInt(whole) * SCALE + BigInt(fraction.padEnd(4, '0'));
}

function fromScaled(value: bigint): string {
  const whole = value / SCALE;
  const fraction = (value % SCALE).toString().padStart(4, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}

function lineRef(line: ReceiveOrderLine): string {
  return line.lineNumber !== undefined && line.lineNumber !== null
    ? String(line.lineNumber)
    : line.id;
}

/** Saldo ainda a receber da linha; nunca negativo. */
export function remainingQuantity(orderedQuantity: string, receivedQuantity: string): string {
  const ordered = toScaled(orderedQuantity);
  const received = toScaled(receivedQuantity);
  if (ordered === null || received === null) {
    return '0';
  }
  const remaining = ordered - received;
  return remaining > 0n ? fromScaled(remaining) : '0';
}

/** Padrão dos campos: o maior valor que o servidor aceita por linha (saldo restante). */
export function defaultReceiveQuantities(lines: ReceiveOrderLine[]): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const line of lines) {
    const remaining = remainingQuantity(line.orderedQuantity, line.receivedQuantity);
    defaults[line.id] = remaining === '0' ? '' : remaining;
  }
  return defaults;
}

export function buildPartialReceive(
  lines: ReceiveOrderLine[],
  quantities: Record<string, string>,
): PartialReceiveResult {
  const issues: string[] = [];
  const payload: ReceivePayloadLine[] = [];
  let total = 0n;

  for (const line of lines) {
    const raw = (quantities[line.id] ?? '').trim();
    if (raw === '') {
      continue;
    }
    const quantity = toScaled(raw);
    if (quantity === null || quantity < 0n) {
      issues.push(`Quantidade inválida na linha ${lineRef(line)}.`);
      continue;
    }
    if (quantity === 0n) {
      continue;
    }
    const remaining = toScaled(remainingQuantity(line.orderedQuantity, line.receivedQuantity));
    if (remaining === null || quantity > remaining) {
      issues.push(`A quantidade da linha ${lineRef(line)} ultrapassa o saldo a receber.`);
      continue;
    }
    payload.push({ spoLineId: line.id, quantity: fromScaled(quantity) });
    total += quantity;
  }

  if (payload.length === 0) {
    issues.push('Informe ao menos uma linha com quantidade maior que zero para receber.');
  }

  return {
    valid: issues.length === 0,
    issues,
    payload,
    totalQuantity: fromScaled(total),
  };
}
