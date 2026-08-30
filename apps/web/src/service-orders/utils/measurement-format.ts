const MONEY_DISPLAY = /^-?(?:\d{1,14})(?:\.\d{1,4})?$/;

export function formatMoneyBrl(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const normalized = value.trim();
  if (!MONEY_DISPLAY.test(normalized)) {
    return value;
  }
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) {
    return value;
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

export function formatQuantity(value: string | null | undefined, unitCode: string): string {
  if (!value) {
    return '—';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return `${value} ${unitCode}`;
  }
  const formatted = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 6,
  }).format(numeric);
  return `${formatted} ${unitCode}`;
}

export function parseQuantityNumber(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function sumMoneyLines(values: Array<string | null>): string {
  let total = 0;
  for (const value of values) {
    if (!value) {
      continue;
    }
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      total += numeric;
    }
  }
  return total.toFixed(4);
}
