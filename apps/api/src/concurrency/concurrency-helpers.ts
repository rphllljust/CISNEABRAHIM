import { expect } from 'vitest';

export function isDeadlockError(error: unknown): boolean {
  const text = String(error);
  return /40P01|deadlock detected/i.test(text);
}

export function countDeadlocks(results: PromiseSettledResult<unknown>[]): number {
  return results.filter(
    (result): result is PromiseRejectedResult =>
      result.status === 'rejected' && isDeadlockError(result.reason),
  ).length;
}

export function assertNoRawSqlLeak(error: unknown): void {
  expect(String(error)).not.toMatch(/23505|pg_|syntax error at or near/i);
}

export async function repeatCritical(
  iterations: number,
  label: string,
  fn: () => Promise<void>,
): Promise<void> {
  for (let index = 0; index < iterations; index += 1) {
    try {
      await fn();
    } catch (error) {
      throw new Error(`${label} failed on iteration ${index + 1}/${iterations}: ${String(error)}`);
    }
  }
}
