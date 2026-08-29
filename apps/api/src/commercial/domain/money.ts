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
