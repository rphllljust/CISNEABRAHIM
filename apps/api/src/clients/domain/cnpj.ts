const CNPJ_DIGITS_LENGTH = 14;

export function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidCnpjFormat(value: string): boolean {
  const digits = normalizeCnpj(value);
  if (digits.length !== CNPJ_DIGITS_LENGTH) {
    return false;
  }
  if (/^(\d)\1+$/.test(digits)) {
    return false;
  }
  return true;
}

export function formatCnpjDisplay(normalized: string): string {
  if (normalized.length !== CNPJ_DIGITS_LENGTH) {
    return normalized;
  }
  return `${normalized.slice(0, 2)}.${normalized.slice(2, 5)}.${normalized.slice(5, 8)}/${normalized.slice(8, 12)}-${normalized.slice(12)}`;
}
