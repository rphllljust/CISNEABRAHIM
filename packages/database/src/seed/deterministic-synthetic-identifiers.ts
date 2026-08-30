import { SYNTHETIC_SEED_NAMESPACE } from './synthetic-seed-constants';

function cnpjCheckDigit(digits: number[], weights: number[]): number {
  const sum = digits.reduce((acc, digit, index) => acc + digit * weights[index]!, 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/**
 * Deterministic synthetically valid CNPJ (checksum only — not a real company).
 * Index is stable across runs for idempotent upsert by normalized_tax_id.
 */
export function deterministicSyntheticCnpj(index: number): string {
  const normalized = Math.abs(index) % 89_999_999;
  const base = String(10_000_000 + normalized).padStart(8, '0');
  const twelve = [...base.split('').map(Number), 0, 0, 0, 1];
  const first = cnpjCheckDigit(twelve, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = cnpjCheckDigit([...twelve, first], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return [...twelve, first, second].join('');
}

export function syntheticExternalRef(scenarioKey: string): string {
  return `${SYNTHETIC_SEED_NAMESPACE}:${scenarioKey}`;
}

export function syntheticInternalCode(prefix: string, scenarioKey: string): string {
  return `${prefix}-${scenarioKey.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`;
}

export function syntheticPoNumber(scenarioKey: string): string {
  return syntheticInternalCode('PO-SYNTH', scenarioKey);
}

/** Mercosul-style test plate — unique per scenario index and resource type. */
export function syntheticVehiclePlate(
  scenarioIndex: number,
  resourceTypeCode: string,
): { plate: string; normalizedPlate: string; plateDisplay: string } {
  const digits = String(Math.abs(scenarioIndex) % 10_000).padStart(4, '0');
  const letters = resourceTypeCode.toUpperCase().replace(/[^A-Z]/g, '');
  const firstLetter = letters[0] ?? 'X';
  const secondLetter = letters[1] ?? firstLetter;
  const plateDisplay = `T${digits[0]}${firstLetter}${digits.slice(1, 3)}${secondLetter}${digits[3]}`;
  const normalizedPlate = plateDisplay.replace(/-/g, '');
  return { plate: plateDisplay, normalizedPlate, plateDisplay };
}
