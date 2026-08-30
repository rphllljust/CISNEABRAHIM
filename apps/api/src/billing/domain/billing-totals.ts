import { normalizeMoneyAmount } from '../../commercial/domain/money';

const MONEY_SCALE_FACTOR = 10_000n;

function toScaledAmount(value: string): bigint {
  const normalized = normalizeMoneyAmount(value);
  const parts = normalized.split('.');
  const whole = parts[0] ?? '0';
  const fraction = parts[1] ?? '';
  const paddedFraction = fraction.padEnd(4, '0').slice(0, 4);
  return BigInt(whole) * MONEY_SCALE_FACTOR + BigInt(paddedFraction);
}

function fromScaledAmount(value: bigint): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const whole = absolute / MONEY_SCALE_FACTOR;
  const fraction = (absolute % MONEY_SCALE_FACTOR).toString().padStart(4, '0');
  const trimmedFraction = fraction.replace(/0+$/, '');
  const formatted = trimmedFraction.length > 0 ? `${whole}.${trimmedFraction}` : `${whole}`;
  return negative ? `-${formatted}` : formatted;
}

export function sumMoneyAmounts(values: Array<string | null | undefined>): string {
  let total = 0n;
  for (const value of values) {
    if (!value) {
      continue;
    }
    total += toScaledAmount(value);
  }
  return fromScaledAmount(total);
}

export function moneyAmountsEqual(left: string, right: string): boolean {
  return toScaledAmount(left) === toScaledAmount(right);
}
