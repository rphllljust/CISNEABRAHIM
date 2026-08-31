export function parsePositiveVersionNumberParam(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error('versionNumber invalid');
  }
  return parsed;
}