export function isServiceRequestUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const pgError = error as { code?: string; constraint?: string };
  return (
    pgError.code === '23505' &&
    (pgError.constraint === 'service_orders_service_request_id_uidx' ||
      pgError.constraint?.includes('service_request_id') === true)
  );
}

export function isServiceOrderUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  return (error as { code?: string }).code === '23505';
}
