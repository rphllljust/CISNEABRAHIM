import { normalizeMoneyAmount } from './money';
import { PURCHASE_ORDER_PRICING_STRUCTURES, type PurchaseOrderPricingStructure } from './purchase-order';

export class PurchaseOrderBalanceError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export type PurchaseOrderBalanceSource = {
  pricingStructure: PurchaseOrderPricingStructure;
  totalAmount: string | null;
  lineTotals: Array<string | null | undefined>;
  consumedAmount: string | null;
  authorizedOverrunAmount?: string | null;
};

const MONEY_SCALE_FACTOR = 10_000n;

function toScaledAmount(value: string): bigint {
  const normalized = normalizeMoneyAmount(value);
  const parts = normalized.split('.');
  const whole = parts[0] ?? '0';
  const fraction = parts[1] ?? '';
  const paddedFraction = fraction.padEnd(4, '0').slice(0, 4);
  return BigInt(whole) * MONEY_SCALE_FACTOR + BigInt(paddedFraction);
}

export function resolvePurchaseOrderAuthorizedAmount(input: PurchaseOrderBalanceSource): string {
  if (input.pricingStructure === PURCHASE_ORDER_PRICING_STRUCTURES.LineItems) {
    const totals = input.lineTotals.filter((value): value is string => Boolean(value));
    if (totals.length === 0) {
      throw new PurchaseOrderBalanceError('AUTHORIZED_AMOUNT_UNAVAILABLE');
    }
    let sum = 0n;
    for (const total of totals) {
      sum += toScaledAmount(total);
    }
    const whole = sum / MONEY_SCALE_FACTOR;
    const fraction = (sum % MONEY_SCALE_FACTOR).toString().padStart(4, '0').replace(/0+$/, '');
    return fraction.length > 0 ? `${whole}.${fraction}` : `${whole}`;
  }

  if (!input.totalAmount) {
    throw new PurchaseOrderBalanceError('AUTHORIZED_AMOUNT_UNAVAILABLE');
  }
  return normalizeMoneyAmount(input.totalAmount);
}

function fromScaled(value: bigint): string {
  const whole = value / MONEY_SCALE_FACTOR;
  const fraction = (value % MONEY_SCALE_FACTOR).toString().padStart(4, '0').replace(/0+$/, '');
  return fraction.length > 0 ? `${whole}.${fraction}` : `${whole}`;
}

export function resolvePurchaseOrderCeiling(input: PurchaseOrderBalanceSource): string {
  const authorized = toScaledAmount(resolvePurchaseOrderAuthorizedAmount(input));
  const overrun = toScaledAmount(normalizeMoneyAmount(input.authorizedOverrunAmount ?? '0'));
  return fromScaled(authorized + overrun);
}

export function computePurchaseOrderAvailableBalance(input: PurchaseOrderBalanceSource): string {
  const ceiling = toScaledAmount(resolvePurchaseOrderCeiling(input));
  const consumed = toScaledAmount(normalizeMoneyAmount(input.consumedAmount ?? '0'));
  const available = ceiling - consumed;
  if (available < 0n) {
    throw new PurchaseOrderBalanceError('CONSUMED_AMOUNT_EXCEEDS_AUTHORIZED');
  }
  return fromScaled(available);
}

export function describePurchaseOrderLedger(input: PurchaseOrderBalanceSource): {
  totalAuthorized: string;
  billed: string;
  authorizedOverrun: string;
  available: string;
} {
  return {
    totalAuthorized: resolvePurchaseOrderAuthorizedAmount(input),
    billed: normalizeMoneyAmount(input.consumedAmount ?? '0'),
    authorizedOverrun: normalizeMoneyAmount(input.authorizedOverrunAmount ?? '0'),
    available: computePurchaseOrderAvailableBalance(input),
  };
}

export function assertPurchaseOrderConsumptionAllowed(
  input: PurchaseOrderBalanceSource,
  amount: string,
): void {
  const ceiling = toScaledAmount(resolvePurchaseOrderCeiling(input));
  const consumed = toScaledAmount(normalizeMoneyAmount(input.consumedAmount ?? '0'));
  const delta = toScaledAmount(amount);
  if (consumed + delta > ceiling) {
    throw new PurchaseOrderBalanceError('PURCHASE_ORDER_BALANCE_EXCEEDED');
  }
}

export function assertPurchaseOrderOverrunAuthorization(input: {
  amount: string;
  justification: string;
}): string {
  const trimmed = input.justification.trim();
  if (trimmed.length === 0) {
    throw new PurchaseOrderBalanceError('OVERRUN_JUSTIFICATION_REQUIRED');
  }
  const normalized = normalizeMoneyAmount(input.amount);
  if (toScaledAmount(normalized) <= 0n) {
    throw new PurchaseOrderBalanceError('OVERRUN_AMOUNT_REQUIRED');
  }
  return normalized;
}
