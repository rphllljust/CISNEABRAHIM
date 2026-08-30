export function formatAddressLine(address: Record<string, unknown> | null | undefined): string {
  if (!address) {
    return '—';
  }
  const parts = [
    address.street,
    address.number,
    address.complement,
    address.district,
    address.city,
    address.state,
    address.postalCode,
  ]
    .filter((part) => typeof part === 'string' && part.trim().length > 0)
    .map((part) => (part as string).trim());
  return parts.length > 0 ? parts.join(', ') : '—';
}
