export function normalizePaymentTerms(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function paymentTermsMatch(left: string, right: string): boolean {
  return normalizePaymentTerms(left).toLowerCase() === normalizePaymentTerms(right).toLowerCase();
}

export function detectCommercialTermsMismatch(
  authoritativeTerms: string | null | undefined,
  declaredTerms: string | null | undefined,
): boolean {
  if (!authoritativeTerms || !declaredTerms) {
    return false;
  }
  return !paymentTermsMatch(authoritativeTerms, declaredTerms);
}
