export function syntheticTaxId(seed: number): string {
  const normalized = Math.abs(seed) % 100_000_000_000_000;
  return String(normalized).padStart(14, '0');
}

export function syntheticInternalCode(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(8, '0')}`;
}
