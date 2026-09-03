export const MONEY_PRECISION = 18;
export const MONEY_SCALE = 4;

const MONEY_PATTERN = /^(?:0|[1-9]\d{0,13})(?:\.\d{1,4})?$/;

export class MoneyValidationError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

export function normalizeMoneyAmount(value: string): string {
  const trimmed = value.trim();
  if (!MONEY_PATTERN.test(trimmed)) {
    throw new MoneyValidationError('INVALID_MONEY_AMOUNT');
  }
  const [whole, fraction = ''] = trimmed.split('.');
  if (fraction.length > MONEY_SCALE) {
    throw new MoneyValidationError('INVALID_MONEY_PRECISION');
  }
  const normalizedFraction = fraction.padEnd(MONEY_SCALE, '0');
  return `${whole}.${normalizedFraction}`;
}

export function parseOptionalMoneyAmount(value: string | undefined | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return normalizeMoneyAmount(trimmed);
}

export function formatMoneyAmountForApi(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  const normalized = normalizeMoneyAmount(value);
  const parts = normalized.split('.');
  const whole = parts[0] ?? '0';
  const fraction = parts[1] ?? '0000';
  const trimmedFraction = fraction.replace(/0+$/, '');
  return trimmedFraction.length > 0 ? `${whole}.${trimmedFraction}` : whole;
}

export function assertCurrencyCode(value: string | undefined): string {
  const currency = (value ?? 'BRL').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new MoneyValidationError('INVALID_CURRENCY_CODE');
  }
  return currency;
}

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

export function compareMoneyAmounts(left: string, right: string): -1 | 0 | 1 {
  const delta = toScaledAmount(left) - toScaledAmount(right);
  if (delta < 0n) {
    return -1;
  }
  if (delta > 0n) {
    return 1;
  }
  return 0;
}

export function subtractMoneyAmounts(left: string, right: string): string {
  return fromScaledAmount(toScaledAmount(left) - toScaledAmount(right));
}

export function isZeroMoneyAmount(value: string): boolean {
  return toScaledAmount(value) === 0n;
}

export function isPositiveMoneyAmount(value: string): boolean {
  return toScaledAmount(value) > 0n;
}

/** Half-up percent of a money amount. percent=5.0000 means 5%, not a tax statute. */
export function multiplyMoneyByPercent(base: string, percent: string): string {
  const product = toScaledAmount(base) * toScaledAmount(percent);
  const rounded = (product + 500_000n) / 1_000_000n;
  return fromScaledAmount(rounded);
}
