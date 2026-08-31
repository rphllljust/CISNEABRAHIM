export type RowVersionCheck = 'match' | 'not_found' | 'mismatch';

export function classifyRowVersion(
  current: { row_version: number } | null | undefined,
  expected: number,
): RowVersionCheck {
  if (!current) {
    return 'not_found';
  }
  if (current.row_version !== expected) {
    return 'mismatch';
  }
  return 'match';
}

export function isOptimisticVersionConflict(check: RowVersionCheck): boolean {
  return check === 'not_found' || check === 'mismatch';
}