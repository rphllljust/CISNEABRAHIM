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

export function computePurchaseOrderAvailableBalance(input: PurchaseOrderBalanceSource): string {
  const authorized = toScaledAmount(resolvePurchaseOrderAuthorizedAmount(input));
  const consumed = toScaledAmount(normalizeMoneyAmount(input.consumedAmount ?? '0'));
  const available = authorized - consumed;
  if (available < 0n) {
    throw new PurchaseOrderBalanceError('CONSUMED_AMOUNT_EXCEEDS_AUTHORIZED');
  }
  const whole = available / MONEY_SCALE_FACTOR;
  const fraction = (available % MONEY_SCALE_FACTOR).toString().padStart(4, '0').replace(/0+$/, '');
  return fraction.length > 0 ? `${whole}.${fraction}` : `${whole}`;
}

export function assertPurchaseOrderConsumptionAllowed(
  input: PurchaseOrderBalanceSource,
  amount: string,
): void {
  const authorized = toScaledAmount(resolvePurchaseOrderAuthorizedAmount(input));
  const consumed = toScaledAmount(normalizeMoneyAmount(input.consumedAmount ?? '0'));
  const delta = toScaledAmount(amount);
  if (consumed + delta > authorized) {
    throw new PurchaseOrderBalanceError('PURCHASE_ORDER_BALANCE_EXCEEDED');
  }
}
