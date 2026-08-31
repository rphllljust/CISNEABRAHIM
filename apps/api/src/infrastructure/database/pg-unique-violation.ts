export function isPostgresUniqueViolation(error: unknown, constraintIncludes?: string): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const pgError = error as { code?: string; constraint?: string };
  if (pgError.code !== '23505') {
    return false;
  }
  if (!constraintIncludes) {
    return true;
  }
  return pgError.constraint?.includes(constraintIncludes) ?? false;
}

export function isIdempotencyKeyViolation(error: unknown): boolean {
  return isPostgresUniqueViolation(error, 'idempotency');
}