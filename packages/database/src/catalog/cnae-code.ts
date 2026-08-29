/**
 * Normalizes CNAE display notation (e.g. 46.19-2-00) to the 7-digit code
 * required by `cat.service_legal_classifications` when scheme = CNAE.
 */
export function normalizeCnaeCode(display: string): string {
  const digits = display.replace(/\D/g, '');
  if (digits.length !== 7) {
    throw new Error(`Invalid CNAE display format: ${display}`);
  }
  return digits;
}

export function portfolioServiceDefinitionCode(cnaeDisplay: string): string {
  return `CNAE-${normalizeCnaeCode(cnaeDisplay)}`;
}
