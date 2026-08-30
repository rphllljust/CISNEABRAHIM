import type { UatFictionalClient } from '../uat/uat-scenarios';

let cnpjSequence = 0;

function cnpjCheckDigit(digits: number[], weights: number[]): number {
  const sum = digits.reduce((acc, digit, index) => acc + digit * weights[index]!, 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/** Generates a synthetically valid CNPJ (checksum only — not a real company). */
export function nextSyntheticCnpj(): string {
  cnpjSequence += 1;
  const base = String(10_000_000 + (cnpjSequence % 89_999_999)).padStart(8, '0');
  const twelve = [...base.split('').map(Number), 0, 0, 0, 1];
  const first = cnpjCheckDigit(twelve, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = cnpjCheckDigit([...twelve, first], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return [...twelve, first, second].join('');
}

export function buildSyntheticUatClient(scenarioId: string, runSuffix: string): UatFictionalClient {
  return {
    legalName: `Synthetic Client ${scenarioId} ${runSuffix}`,
    tradeName: `SYN-${runSuffix}`,
    taxId: nextSyntheticCnpj(),
    contactName: `Contact ${runSuffix}`,
    city: `City-${runSuffix.slice(0, 6)}`,
  };
}

export function buildDeterministicSyntheticClient(
  displayLabel: string,
  scenarioKey: string,
  cnpjIndex: number,
): UatFictionalClient {
  const suffix = scenarioKey.toUpperCase().replace(/[^A-Z0-9]+/g, '-');
  return {
    legalName: `TESTE — ${displayLabel}`,
    tradeName: `TESTE-${suffix}`,
    taxId: deterministicCnpjFromIndex(cnpjIndex),
    contactName: `Contato Sintético ${suffix}`,
    city: 'Porto Velho',
  };
}

function deterministicCnpjFromIndex(index: number): string {
  cnpjSequence = index;
  return nextSyntheticCnpj();
}

export function resetSyntheticCnpjSequence(): void {
  cnpjSequence = 0;
}
